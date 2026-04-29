import io
import json
import uuid
from datetime import datetime
from typing import Any

import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.ml.pii_scrubber import PIIScrubber
from src.ml.structured_input_parser import StructuredInputParser
from src.ml.embedding_service import embedding_service
from src.repositories.models import MappingConfig, Ticket, TicketEmbedding, Folder, TicketFolderAssignment
from src.schemas.ticket import Category

CATEGORY_SHORT_CODES = {
    Category.INFRASTRUCTURE: "INF",
    Category.APPLICATION: "APP",
    Category.SECURITY: "SEC",
    Category.DATABASE: "DB",
    Category.STORAGE: "STR",
    Category.NETWORK: "NET",
    Category.ACCESS_MANAGEMENT: "ACC",
}


class ImportService:
    @staticmethod
    async def process_import(
        file_content: bytes,
        file_extension: str,
        mapping: dict[str, str],
        owner_id: str,
        session: AsyncSession,
    ) -> dict[str, Any]:
        """
        Processes a CSV or Excel file import into the TicketIQ system.

        mapping format: { "source_column_name": "target_field_name" }
        target_field_name options: "title", "description", "category", "priority", "status"
        """
        try:
            # 1. Load data
            if file_extension.lower() == "csv":
                df = pd.read_csv(io.BytesIO(file_content))
            elif file_extension.lower() in ["xlsx", "xls"]:
                df = pd.read_excel(io.BytesIO(file_content))
            else:
                raise ValueError(f"Unsupported file format: {file_extension}")

            # 2. Extract and Validate
            tickets_to_create = []
            import_stats = {
                "total_rows": len(df),
                "processed": 0,
                "failed": 0,
                "pii_redactions": 0,
            }

            # Required fields for TicketIQ
            import structlog
            logger = structlog.get_logger("api.import")
            logger.info("import.mapping_received", mapping=mapping)
            
            required_targets = ["title", "description"]
            
            for target in required_targets:
                if target not in mapping:
                    raise ValueError(f"Mapping missing required field: {target}")

            # 3. Process Rows
            for _, row in df.iterrows():
                try:
                    # Map source columns to ticket fields
                    # mapping is { "target_field": "source_column_name" }
                    raw_title = str(row.get(mapping.get("title"), ""))
                    raw_description = str(
                        row.get(mapping.get("description"), "")
                    )

                    # Optional fields
                    category = (
                        row.get(mapping.get("category"))
                        if "category" in mapping and mapping.get("category")
                        else None
                    )
                    priority = (
                        row.get(mapping.get("priority"))
                        if "priority" in mapping and mapping.get("priority")
                        else "medium"
                    )
                    status = (
                        row.get(mapping.get("status"))
                        if "status" in mapping and mapping.get("status")
                        else "open"
                    )

                    # 4. Mandatory PII Scrubbing
                    scrubbed_title, title_metrics = PIIScrubber.scrub(raw_title)
                    scrubbed_description, desc_metrics = PIIScrubber.scrub(
                        raw_description
                    )

                    import_stats["pii_redactions"] += (
                        title_metrics["total_detected"] + desc_metrics["total_detected"]
                    )

                    # 5. Extract Structured Intelligence (if description contains logs/payloads)
                    context, format_type, parse_warning, causal_signal = (
                        StructuredInputParser.parse(scrubbed_description)
                    )

                    # 6. Create Ticket Object
                    ticket = Ticket(
                        id=str(uuid.uuid4()),
                        title=scrubbed_title,
                        description=scrubbed_description,
                        owner_id=owner_id,
                        category=category,
                        priority=str(priority),
                        status=str(status),
                        structured_payload=json.dumps(context),
                        causal_signal=causal_signal,
                        parse_warning=parse_warning,
                        source_channel="batch_import",
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow(),
                    )

                    # 6a. Generate Standard Ticket Number (TICK-CAT-00000)
                    try:
                        short_code = "GEN"
                        if category:
                            # Handle both string and enum
                            cat_val = category if isinstance(category, str) else category.value
                            for cat_enum, code in CATEGORY_SHORT_CODES.items():
                                if cat_enum.value == cat_val:
                                    short_code = code
                                    break
                        
                        # We use a temporary placeholder and update it after we know the count
                        # but for bulk, we can just use a sequence if we fetch the base count
                        ticket.ticket_number = f"TICK-{short_code}-PENDING-{uuid.uuid4().hex[:6]}"
                    except Exception:
                        ticket.ticket_number = f"TICK-GEN-{ticket.id[:6]}"

                    tickets_to_create.append(ticket)
                    import_stats["processed"] += 1
                except Exception:
                    import_stats["failed"] += 1
                    continue

            # 7. Bulk Persistence
            if tickets_to_create:
                logger = structlog.get_logger("api.import")
                logger.info("import.persistence_start", count=len(tickets_to_create))
                
                # 7a. Get or create department folders for routing
                unique_categories = {t.category for t in tickets_to_create if t.category}
                folder_map = {}
                
                for category in unique_categories:
                    folder_name = str(category)
                    stmt = select(Folder).where(Folder.name == folder_name, Folder.owner_id == owner_id)
                    result = await session.execute(stmt)
                    folder = result.scalars().first()
                    
                    if not folder:
                        folder = Folder(
                            id=str(uuid.uuid4()),
                            name=folder_name,
                            owner_id=owner_id,
                            created_at=datetime.utcnow(),
                            updated_at=datetime.utcnow()
                        )
                        session.add(folder)
                    folder_map[category] = folder
                
                session.add_all(tickets_to_create)
                await session.flush() # Ensure ticket IDs and folder IDs are available
                
                # 7c. Finalize Ticket Numbers based on actual count
                from sqlalchemy import func
                base_count_stmt = select(func.count(Ticket.id))
                base_count_result = await session.execute(base_count_stmt)
                total_tickets = base_count_result.scalar() or 0
                
                # The total_tickets includes the ones we just added but haven't committed yet
                # So the start index for our batch is total_tickets - len(tickets_to_create)
                start_idx = total_tickets - len(tickets_to_create) + 101
                
                for i, t in enumerate(tickets_to_create):
                    if "PENDING" in t.ticket_number:
                        prefix = t.ticket_number.split("-PENDING")[0]
                        t.ticket_number = f"{prefix}-{start_idx + i:05d}"
                
                # 7b. Create Ticket-Folder Assignments
                assignments = []
                for t in tickets_to_create:
                    if t.category and t.category in folder_map:
                        assignments.append(
                            TicketFolderAssignment(
                                id=str(uuid.uuid4()),
                                ticket_id=t.id,
                                folder_id=folder_map[t.category].id,
                                assigned_at=datetime.utcnow()
                            )
                        )
                
                if assignments:
                    session.add_all(assignments)
                    await session.flush()
                
                # 8. Post-Ingestion Intelligence (Embeddings) - Batched to prevent timeouts
                try:
                    logger.info("import.intelligence_start")
                    batch_size = 50
                    for i in range(0, len(tickets_to_create), batch_size):
                        batch = tickets_to_create[i:i+batch_size]
                        logger.info("import.intelligence_batch", start=i, end=min(i+batch_size, len(tickets_to_create)))
                        
                        texts = [f"{t.title}. {t.description}" for t in batch]
                        embeddings = embedding_service.get_embeddings(texts)
                        
                        embedding_objs = []
                        for j, ticket in enumerate(batch):
                            embedding_objs.append(
                                TicketEmbedding(
                                    id=str(uuid.uuid4()),
                                    ticket_id=ticket.id,
                                    embedding=json.dumps(embeddings[j].tolist()),
                                    model_version=embedding_service.model_name,
                                    created_at=datetime.utcnow()
                                )
                            )
                        
                        if embedding_objs:
                            session.add_all(embedding_objs)
                            await session.flush()
                            
                    logger.info("import.intelligence_complete")
                except Exception as e:
                    logger.error("import.intelligence_failed", error=str(e))
                    # Don't fail the whole import if embeddings fail
            
                await session.commit()
                logger.info("import.commit_success", total=import_stats["processed"])

            return {
                "success": True,
                "stats": import_stats,
                "message": f"Successfully imported {import_stats['processed']} tickets.",
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Import failed during processing.",
            }

    @staticmethod
    async def save_mapping_config(
        name: str, mapping: dict[str, str], owner_id: str, session: AsyncSession
    ) -> MappingConfig:
        config = MappingConfig(
            id=str(uuid.uuid4()),
            name=name,
            config_json=json.dumps(mapping),
            owner_id=owner_id,
        )
        session.add(config)
        await session.commit()
        return config

    @staticmethod
    async def analyze_file(file_content: bytes, file_extension: str) -> dict[str, Any]:
        """Extracts headers and first few rows for the mapping wizard preview."""
        try:
            if file_extension.lower() == "csv":
                df = pd.read_csv(io.BytesIO(file_content), nrows=5)
            elif file_extension.lower() in ["xlsx", "xls"]:
                df = pd.read_excel(io.BytesIO(file_content), nrows=5)
            else:
                raise ValueError(f"Unsupported file format: {file_extension}")

            return {
                "success": True,
                "headers": df.columns.tolist(),
                "preview": df.to_dict(orient="records"),
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    async def get_mapping_configs(
        owner_id: str, session: AsyncSession
    ) -> list[MappingConfig]:
        stmt = select(MappingConfig).where(MappingConfig.owner_id == owner_id)
        result = await session.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    def get_domain_templates() -> dict[str, dict[str, str]]:
        """
        Provides industrial-standard mapping templates for specific domains.
        Requirement: Cross-Domain ETL Mapper (Requirement Phase 1 Polish)
        """
        return {
            "Healthcare (HIPAA/DPDP)": {
                "Patient Name": "title",
                "Patient ID": "national_id",
                "Diagnosis Summary": "description",
                "Department": "category",
                "Admission Priority": "priority",
            },
            "Legal & Compliance": {
                "Case Title": "title",
                "Case Reference": "description",
                "Client Identifier": "national_id",
                "Practice Area": "category",
                "Urgency": "priority",
            },
            "Financial Services": {
                "Account Holder": "title",
                "Transaction ID": "description",
                "PAN Number": "national_id",
                "Service Type": "category",
                "Risk Level": "priority",
            },
            "IT Service Management (ITSM)": {
                "Subject": "title",
                "Description": "description",
                "CI Name": "national_id",
                "Service": "category",
                "Impact": "priority",
            },
        }
