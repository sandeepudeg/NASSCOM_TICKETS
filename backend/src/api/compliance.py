from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import io
from datetime import datetime

from src.repositories.database import get_db
from src.services.report_service import ReportService

router = APIRouter(prefix="/compliance", tags=["compliance"])

@router.get("/report")
async def generate_compliance_report(
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a PDF compliance report and return it as a downloadable file.
    """
    service = ReportService(db)
    pdf_content = await service.generate_standard_report()
    
    # Create a buffer for the streaming response
    buffer = io.BytesIO(pdf_content)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"TicketIQ_Compliance_Report_{timestamp}.pdf"
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )