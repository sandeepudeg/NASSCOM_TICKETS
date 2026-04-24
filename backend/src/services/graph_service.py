import json
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.repositories.models import Ticket, TicketEmbedding
from src.schemas.ticket import TicketResponse
from src.services.converters import ticket_to_response

class GraphService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_semantic_graph(self, ticket_id: str, window_hours: int = 168) -> dict:
        """
        Builds a relationship graph for a ticket.
        Finds all tickets within the time window that have > 0.85 similarity.
        """
        # 1. Get target ticket and its embedding
        target_query = select(Ticket, TicketEmbedding.embedding).join(
            TicketEmbedding, Ticket.id == TicketEmbedding.ticket_id
        ).where(Ticket.id == ticket_id)
        
        target_result = await self.session.execute(target_query)
        target_row = target_result.first()
        
        if not target_row:
            return {"nodes": [], "edges": [], "cluster_name": "Isolated Event"}

        target_ticket, target_emb_json = target_row
        target_emb = np.array(json.loads(target_emb_json))

        # 2. Get recent tickets and their embeddings
        since_date = datetime.utcnow() - timedelta(hours=window_hours)
        recent_query = select(Ticket, TicketEmbedding.embedding).join(
            TicketEmbedding, Ticket.id == TicketEmbedding.ticket_id
        ).where(Ticket.created_at >= since_date)
        
        recent_result = await self.session.execute(recent_query)
        recent_rows = recent_result.all()

        nodes = []
        edges = []
        
        # Add target node
        nodes.append({
            "id": target_ticket.id,
            "label": target_ticket.title,
            "category": target_ticket.category,
            "status": target_ticket.status,
            "is_target": True
        })

        # 3. Calculate similarities
        for other_ticket, other_emb_json in recent_rows:
            if other_ticket.id == ticket_id:
                continue
            
            other_emb = np.array(json.loads(other_emb_json))
            
            # Simple Cosine Similarity
            dot_product = np.dot(target_emb, other_emb)
            norm_a = np.linalg.norm(target_emb)
            norm_b = np.linalg.norm(other_emb)
            similarity = dot_product / (norm_a * norm_b)

            if similarity > 0.85:
                nodes.append({
                    "id": other_ticket.id,
                    "label": other_ticket.title,
                    "category": other_ticket.category,
                    "status": other_ticket.status,
                    "is_target": False
                })
                edges.append({
                    "from": ticket_id,
                    "to": other_ticket.id,
                    "strength": float(similarity)
                })

        # 4. Generate a cluster name if multiple nodes exist
        cluster_name = "Isolated Incident"
        if len(nodes) > 1:
            cluster_name = f"Semantic Cluster: {target_ticket.category} Pattern"

        return {
            "nodes": nodes,
            "edges": edges,
            "cluster_name": cluster_name,
            "total_correlated": len(nodes) - 1
        }
