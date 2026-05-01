
import asyncio
from src.repositories.database import engine
from sqlalchemy import text

async def migrate_enum():
    async with engine.begin() as conn:
        print("Altering enums...")
        
        enums = [
            "category_enum",
            "similar_category_enum",
            "pattern_category_enum",
            "override_original_category_enum",
            "override_corrected_category_enum"
        ]
        
        mapping = {
            "infrastructure": "Infrastructure",
            "application": "Application",
            "security": "Security",
            "database": "Database",
            "storage": "Storage",
            "network": "Network",
            "access": "Access"
        }
        
        for enum_name in enums:
            print(f"Processing {enum_name}...")
            for old, new in mapping.items():
                cmd = f"ALTER TYPE {enum_name} RENAME VALUE '{old}' TO '{new}'"
                try:
                    await conn.execute(text(cmd))
                    print(f"Executed: {cmd}")
                except Exception as e:
                    pass

if __name__ == "__main__":
    asyncio.run(migrate_enum())
