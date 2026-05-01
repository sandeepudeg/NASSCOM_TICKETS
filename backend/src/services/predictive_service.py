from datetime import datetime, timedelta
from src.schemas.ticket import Category

class PredictiveService:
    # Base TTR (Minutes) per Category
    BASE_TTR = {
        Category.INFRASTRUCTURE: 60,
        Category.APPLICATION: 45,
        Category.SECURITY: 120,
        Category.DATABASE: 90,
        Category.STORAGE: 60,
        Category.NETWORK: 30,
        Category.ACCESS: 15,
    }

    @classmethod
    def calculate_estimated_resolution(
        cls, 
        category: str, 
        complexity: int, 
        created_at: datetime
    ) -> datetime:
        """
        Calculates Estimated TTR using the formula:
        Adjusted_TTR = Base_TTR * (1 + 0.3 * (complexity - 1))
        """
        try:
            cat_enum = Category(category)
            base_min = cls.BASE_TTR.get(cat_enum, 45)
        except ValueError:
            base_min = 45

        # Heuristic: Complexity 1 = Base, Complexity 5 = 2.2x Base
        adjustment_factor = 1 + (0.3 * (complexity - 1))
        estimated_min = base_min * adjustment_factor
        
        return created_at + timedelta(minutes=int(estimated_min))

    @classmethod
    def determine_sla_status(
        cls, 
        created_at: datetime, 
        estimated_resolution_at: datetime,
        sla_window_hours: int = 4
    ) -> str:
        """
        Logic for SLA health forecasting.
        """
        now = datetime.utcnow()
        sla_deadline = created_at + timedelta(hours=sla_window_hours)
        
        if now > sla_deadline:
            return "breached"
            
        # If estimated resolution is within 30 minutes of deadline, mark as at_risk
        if estimated_resolution_at > (sla_deadline - timedelta(minutes=30)):
            return "at_risk"
            
        return "on_track"

predictive_service = PredictiveService()
