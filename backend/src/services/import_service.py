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
from src.repositories.models import MappingConfig, Ticket


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
            required_targets = ["title", "description"]
            reverse_mapping = {v: k for k, v in mapping.items()}

            for target in required_targets:
                if target not in reverse_mapping:
                    raise ValueError(f"Mapping missing required field: {target}")

            # 3. Process Rows
            for _, row in df.iterrows():
                try:
                    # Map source columns to ticket fields
                    raw_title = str(row.get(reverse_mapping.get("title"), ""))
                    raw_description = str(
                        row.get(reverse_mapping.get("description"), "")
                    )

                    # Optional fields
                    category = (
                        row.get(reverse_mapping.get("category"))
                        if "category" in reverse_mapping
                        else None
                    )
                    priority = (
                        row.get(reverse_mapping.get("priority"))
                        if "priority" in reverse_mapping
                        else "medium"
                    )
                    status = (
                        row.get(reverse_mapping.get("status"))
                        if "status" in reverse_mapping
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

                    tickets_to_create.append(ticket)
                    import_stats["processed"] += 1
                except Exception:
                    import_stats["failed"] += 1
                    continue

            # 7. Bulk Persistence
            if tickets_to_create:
                session.add_all(tickets_to_create)
                await session.commit()

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
