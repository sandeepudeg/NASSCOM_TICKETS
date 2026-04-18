import asyncio
import sys
sys.path.append('.')
from src.repositories.database import async_session_maker
from src.services.report_service import ReportService

async def main():
    async with async_session_maker() as db:
        svc = ReportService(db)
        pdf = await svc.generate_standard_report()
        with open('test_output.pdf', 'wb') as f:
            f.write(pdf)
        print("Success! Wrote bytes:", len(pdf))
        print("Starts with:", pdf[:10])

asyncio.run(main())
