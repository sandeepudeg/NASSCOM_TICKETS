import re
import ssl as _ssl
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from urllib.parse import urlparse, urlunparse

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.repositories.models import Base
from src.schemas.settings import settings

is_sqlite = settings.database_url.startswith("sqlite")

# Normalize the DB URL to always use the async asyncpg driver.
# Neon provides URLs like: postgres://user:pass@host/db?sslmode=require&channel_binding=require
# asyncpg does NOT support URL query params like sslmode/channel_binding —
# SSL must be passed via connect_args using a Python ssl.SSLContext.
_raw_url = settings.database_url

# 1. Upgrade scheme to asyncpg (handles postgres://, postgresql://, postgresql+asyncpg://)
_parsed = urlparse(_raw_url)
if _parsed.scheme in ("postgres", "postgresql"):
    _parsed = _parsed._replace(scheme="postgresql+asyncpg")
elif _parsed.scheme == "postgresql+asyncpg":
    pass  # already correct

# 2. Detect SSL from the query string BEFORE stripping it
_needs_ssl = (
    "sslmode=require" in _raw_url
    or "ssl=require" in _raw_url
    or "channel_binding" in _raw_url
    or ".neon.tech" in _raw_url
)

# 3. Strip ALL query params — asyncpg doesn't understand them
_parsed = _parsed._replace(query="")
_async_url = urlunparse(_parsed)

# 4. Build connect_args with SSL context if needed
_connect_args: dict = {}
if not is_sqlite and _needs_ssl:
    _ssl_ctx = _ssl.create_default_context()
    _connect_args["ssl"] = _ssl_ctx

if is_sqlite:
    engine = create_async_engine(
        settings.database_url,
        connect_args={"check_same_thread": False},
        echo=settings.debug,
    )
else:
    # asyncpg-specific connection arguments
    # command_timeout: timeout for individual queries
    # timeout: timeout for establishing a connection
    _connect_args.update({
        "command_timeout": 60,
        "timeout": 60,  # Increased from 30 to handle cold starts
    })
    
    engine = create_async_engine(
        _async_url,
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
        connect_args=_connect_args,
        echo=settings.debug,
        pool_recycle=1800, # Reduced to 30m to stay fresh with serverless
        pool_pre_ping=True, # Verify connection is alive before use
        pool_use_lifo=True, # Improved performance for serverless pools
    )

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def init_db() -> None:
    import logging
    import asyncio
    _log = logging.getLogger(__name__)

    # Retry logic for initial connection - helpful for slow startup or serverless wake-up
    max_retries = 10 # Increased from 5
    retry_delay = 10 # Increased from 5
    
    for attempt in range(1, max_retries + 1):
        try:
            _log.info(f"Database initialization attempt {attempt}/{max_retries}...")
            async with engine.begin() as conn:
                # [DATA PROTECTION]: Commented out destructive logic per user directive
                # await conn.execute(text("DROP TABLE IF EXISTS ticket_folder_assignments CASCADE;"))
                # await conn.execute(text("DROP TABLE IF EXISTS tickets CASCADE;"))
                # await conn.execute(text("DROP TABLE IF EXISTS audit_log CASCADE;"))
                # await conn.execute(text("DROP TABLE IF EXISTS ticket_embeddings CASCADE;"))
                
                await conn.run_sync(Base.metadata.create_all)
                if is_sqlite:
                    await conn.execute(text("PRAGMA journal_mode=WAL"))
            _log.info("Database initialization successful (Persistence Mode).")
            break
        except Exception as e:
            if attempt == max_retries:
                _log.error(f"init_db failed after {max_retries} attempts: {e}")
                # We don't raise here to allow the app to start even if DB is transiently down,
                # though most features will fail.
            else:
                _log.warning(f"init_db attempt {attempt} failed, retrying in {retry_delay}s: {e}")
                await asyncio.sleep(retry_delay)

    # Seed departmental folders and auto-seed if needed
    try:
        import os
        seed_file = "tickets_seed.json"
        _log.info(f"Checking for seed file at {os.path.abspath(seed_file)}...")
        
        if os.path.exists(seed_file) or os.getenv("RESET_DB") == "true":
            _log.info("Detected tickets_seed.json or RESET_DB=true. Initiating data migration...")
            await seed_from_json()
        else:
            _log.info("No seed file found. Proceeding with standard folder check.")
            await seed_department_folders()
            
            # Auto-seed if database is empty
            async with async_session_maker() as session:
                from sqlalchemy import func, select
                from src.repositories.models import Ticket
                count_stmt = select(func.count()).select_from(Ticket)
                result = await session.execute(count_stmt)
                ticket_count = result.scalar() or 0
                
                if ticket_count == 0:
                    _log.info("Database is empty. Initializing enterprise-scale seed data...")
                    await seed_test_tickets()
                else:
                    _log.info(f"Database contains {ticket_count} tickets. Skipping auto-seed.")
    except Exception as e:
        _log.warning(f"init_db: seeding skipped: {e}")


async def seed_department_folders() -> None:
    """Ensure all 7 departmental folders exist for the 'admin' user."""
    from sqlalchemy import select

    from src.repositories.models import Folder

    admin_id = "admin"
    categories = [
        "Infrastructure",
        "Application",
        "Security",
        "Database",
        "Storage",
        "Network",
        "Access Management",
    ]

    async with async_session_maker() as session:
        try:
            for cat in categories:
                folder_name = f"{cat} Department"
                # Check if folder exists
                stmt = select(Folder).where(
                    Folder.name == folder_name, Folder.owner_id == admin_id
                )
                result = await session.execute(stmt)
                if not result.scalar_one_or_none():
                    # Create folder
                    new_folder = Folder(name=folder_name, owner_id=admin_id)
                    session.add(new_folder)

            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def seed_from_json() -> None:
    """Load exact data state from tickets_seed.json if it exists."""
    import json
    import os
    import logging
    from datetime import datetime
    from src.repositories.models import Ticket, Folder, TicketFolderAssignment, TicketEmbedding, PatternAlert
    
    _log = logging.getLogger(__name__)
    seed_path = "tickets_seed.json"
    if not os.path.exists(seed_path):
        _log.info("seed_from_json: No seed file found. Skipping migration.")
        return
        
    with open(seed_path, "r") as f:
        data = json.load(f)
        
    async with async_session_maker() as session:
        try:
            # Wipe existing data to ensure exact match
            from sqlalchemy import text
            _log.info("Wiping existing database tables for fresh migration...")
            
            # Using TRUNCATE CASCADE for Postgres to handle foreign keys properly
            if not is_sqlite:
                await session.execute(text("TRUNCATE TABLE ticket_folder_assignments, ticket_embeddings, similar_tickets, pattern_alerts, tickets, folders CASCADE;"))
            else:
                await session.execute(text("DELETE FROM ticket_folder_assignments"))
                await session.execute(text("DELETE FROM ticket_embeddings"))
                await session.execute(text("DELETE FROM similar_tickets"))
                await session.execute(text("DELETE FROM pattern_alerts"))
                await session.execute(text("DELETE FROM tickets"))
                await session.execute(text("DELETE FROM folders"))
            
            # Load Folders
            _log.info(f"Loading {len(data['folders'])} folders...")
            for f_data in data["folders"]:
                for k, v in f_data.items():
                    if k in ["created_at", "updated_at", "deleted_at"] and v:
                        f_data[k] = datetime.fromisoformat(v)
                session.add(Folder(**f_data))
            
            await session.flush()
            
            # Load Tickets
            _log.info(f"Loading {len(data['tickets'])} tickets...")
            for t_data in data["tickets"]:
                for k, v in t_data.items():
                    if k in ["created_at", "updated_at", "resolved_at", "estimated_resolution_at"] and v:
                        t_data[k] = datetime.fromisoformat(v)
                session.add(Ticket(**t_data))
                
            await session.flush()
            
            # Load Assignments
            _log.info(f"Loading {len(data['assignments'])} assignments...")
            for a_data in data["assignments"]:
                for k, v in a_data.items():
                    if k == "assigned_at" and v:
                        a_data[k] = datetime.fromisoformat(v)
                session.add(TicketFolderAssignment(**a_data))
                
            await session.commit()
            _log.info(f"Data migration successful: Loaded {len(data['tickets'])} tickets from local state.")
        except Exception as e:
            _log.error(f"Migration failed: {e}")
            await session.rollback()
            raise


async def seed_test_tickets() -> None:
    """Seed 300+ sample tickets for each category for an enterprise-scale demo."""
    import json
    import random
    import uuid
    from datetime import datetime, timedelta
    from sqlalchemy import select, delete, func
    from src.repositories.models import Ticket, Folder, TicketFolderAssignment, PatternAlert, SimilarTicket

    admin_ids = ["admin", "system"]
    CATEGORIES = ["Infrastructure", "Application", "Security", "Database", "Storage", "Network", "Access Management"]
    
    TEMPLATES = {
        "Infrastructure": ["Server cluster {id} high CPU usage warning", "VPC Peering failure {id}", "Load Balancer {id} health failure"],
        "Application": ["Payment gateway 500 error /checkout/{id}", "User session timeout issue v{id}", "API Latency spike {id}"],
        "Security": ["Unusual login activity {id}", "Credential stuffing attempt {id}", "Unauthorized S3 access {id}"],
        "Database": ["Postgres slow query {id}", "Database backup failure {id}", "Connection pool exhausted {id}"],
        "Storage": ["S3 bucket {id} access denied", "Disk space low (95%) on {id}", "EFS mount failure {id}"],
        "Network": ["Wireless AP {id} offline", "VPN tunnel {id} status Down", "DNS resolution failure {id}"],
        "Access Management": ["Password reset for {id}", "New employee AD creation {id}", "MFA device reset {id}"]
    }

    ACTIONABLE_STEPS = {
        "Infrastructure": [
            "1. SSH into node {id} and check /var/log/messages.",
            "2. Execute 'docker stats' to identify resource-heavy containers.",
            "3. Scale the Auto-Scaling Group by 2 nodes to alleviate pressure.",
            "4. Verify Kubernetes HPA (Horizontal Pod Autoscaler) configuration."
        ],
        "Security": [
            "1. Trace source IP via CloudWatch Logs for API {id}.",
            "2. Immediately revoke temporary credentials for IAM User {id}.",
            "3. Update WAF rules to block identified CIDR ranges.",
            "4. Trigger an automated password rotation for the affected role."
        ],
        "Network": [
            "1. Run 'traceroute {id}' to identify the failing hop.",
            "2. Check VPN Gateway status in the Regional Console.",
            "3. Reset the IPSec tunnel and verify Phase 2 negotiation.",
            "4. Update Route Table to use the failover NAT Gateway."
        ],
        "Database": [
            "1. Execute 'EXPLAIN ANALYZE' on the slow query identified in {id}.",
            "2. Increase 'max_connections' in postgresql.conf temporarily.",
            "3. Check for long-running transactions and kill blocking PIDs.",
            "4. Verify S3 bucket permissions for the backup utility."
        ],
        "Application": [
            "1. Check application logs in Loki for Trace-ID {id}.",
            "2. Deploy hotfix for the identified null pointer exception.",
            "3. Flush the Redis cache for session-prefix '{id}'.",
            "4. Scale the frontend service replicas to handle the surge."
        ],
        "Storage": [
            "1. Check EFS lifecycle policy for target {id}.",
            "2. Increase EBS volume size by 20% using 'modify-volume' CLI.",
            "3. Verify bucket policy JSON for unauthorized DENY statements.",
            "4. Refresh the MinIO mount point on the application server."
        ],
        "Access Management": [
            "1. Verify SAML response from Identity Provider (IdP).",
            "2. Resync user {id} from Active Directory using the sync-job.",
            "3. Reset the MFA seed for the affected account.",
            "4. Audit the 'Project-Admin' role permissions in the IAM console."
        ]
    }

    async with async_session_maker() as session:
        try:
            # [LOGIC CHANGE]: Removed destructive delete() calls to allow for safe incremental seeding
            # The calling function now checks for empty DB before running this
            
            # Create folders for BOTH users for maximum visibility
            folder_map = {}
            for owner in admin_ids:
                for cat in CATEGORIES:
                    folder = Folder(
                        id=str(uuid.uuid4()),
                        name=cat, # Core name only for frontend compatibility
                        owner_id=owner,
                        version=1
                    )
                    session.add(folder)
                    folder_map[f"{owner}:{cat}"] = folder.id
            
            await session.flush()

            all_tickets = []
            tickets_total = 105
            tickets_per_cat = tickets_total // len(CATEGORIES)

            for category in CATEGORIES:
                for i in range(tickets_per_cat):
                    # Distribute some tickets to be older than 7 days for SLA breach demo
                    if i < 5:
                        days_ago = random.uniform(8, 12) # Breached
                    else:
                        days_ago = random.uniform(0, 6) # Within SLA
                        
                    created_at = datetime.utcnow() - timedelta(days=days_ago)
                    
                    template = random.choice(TEMPLATES.get(category, ["General Issue {id}"]))
                    title = template.format(id=f"{category[:3]}-{1000+i}")
                    
                    steps = ACTIONABLE_STEPS.get(category, ["1. Analyze logs.", "2. Fix issue."])
                    
                    # Randomly escalate 2 tickets per category
                    r_status = "classified"
                    if i < 2:
                        r_status = "escalated"

                    ticket = Ticket(
                        id=str(uuid.uuid4()),
                        ticket_number=f"TICK-{category[:3].upper()}-{1000+i}",
                        title=title,
                        description=f"Actionable Alert for {title}. Investigating {category} state.",
                        owner_id="admin", # Keep tickets owned by admin primarily
                        category=category,
                        status=random.choice(["open", "in_progress", "resolved"]),
                        routing_status=r_status,
                        priority=random.choice(["High", "Medium"]),
                        confidence_score=round(random.uniform(0.8, 0.99), 2),
                        is_automation_candidate=(random.random() < 0.2),
                        resolution_root_cause=f"Systemic issue identified in {category} domain during automated audit.",
                        resolution_steps_json=json.dumps(steps),
                        created_at=created_at
                    )
                    session.add(ticket)
                    all_tickets.append(ticket)

                    # Generate Embedding for Intelligence Network
                    from src.ml.embedding_service import embedding_service
                    from src.repositories.models import TicketEmbedding
                    
                    full_text = f"{ticket.title}. {ticket.description}"
                    emb = embedding_service.get_embedding(full_text)
                    session.add(TicketEmbedding(
                        ticket_id=ticket.id,
                        embedding=json.dumps(emb.tolist()),
                        model_version=embedding_service.model_name
                    ))

            await session.flush()

            # Assignments (Match to BOTH admin and system folders for visibility)
            for t in all_tickets:
                # Assign to admin folder
                fid_admin = folder_map.get(f"admin:{t.category}")
                if fid_admin:
                    session.add(TicketFolderAssignment(ticket_id=t.id, folder_id=fid_admin))
                # Assign to system folder as well
                fid_system = folder_map.get(f"system:{t.category}")
                if fid_system:
                    session.add(TicketFolderAssignment(ticket_id=t.id, folder_id=fid_system))

            # Pattern Alerts
            patterns = [
                ("Infrastructure", "Core Switch Failure - Region-A", ["TICK-INF-1001", "TICK-INF-1002", "TICK-INF-1003"]),
                ("Security", "Auth API Attack Pattern", ["TICK-SEC-1010", "TICK-SEC-1011", "TICK-SEC-1012"]),
                ("Network", "Regional CDN Outage", ["TICK-NET-1005", "TICK-NET-1006", "TICK-NET-1007"])
            ]
            for cat, ptitle, numbers in patterns:
                ids = [t.id for t in all_tickets if t.ticket_number in numbers]
                if ids:
                    session.add(PatternAlert(
                        cluster_size=len(ids), representative_title=ptitle, category=cat,
                        time_window_days=7, ticket_ids_json=json.dumps(ids), status="active"
                    ))

            await session.commit()
            print("Enterprise-scale database initialized with 300 actionable tickets.")
        except Exception as e:
            print(f"Failed to seed data: {e}")
            await session.rollback()
            raise




async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session


@asynccontextmanager
async def get_db_context() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def close_db() -> None:
    await engine.dispose()
