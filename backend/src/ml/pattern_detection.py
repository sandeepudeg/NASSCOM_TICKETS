import asyncio
from datetime import datetime, timedelta
from typing import Optional
import numpy as np
import json
from opentelemetry import trace

from src.repositories.audit_repository import PatternAlertRepository
from src.repositories.ticket_repository import TicketRepository
from src.schemas.settings import settings
from src.schemas.ticket import Category
from src.ml.embedding_service import embedding_service


class PatternDetectionService:
    def __init__(self):
        self.window_days = settings.pattern_window_days
        self.similarity_threshold = settings.pattern_similarity_threshold
        self.cluster_min_size = settings.pattern_cluster_min_size

    async def detect_patterns(
        self,
        ticket_embeddings: list[dict],
    ) -> list[dict]:
        tracer = trace.get_tracer("ml.pattern_detection")
        
        with tracer.start_as_current_span("pattern_detector.scan") as span:
            if len(ticket_embeddings) < self.cluster_min_size:
                return []

            embeddings = []
            valid_tickets = []

            for item in ticket_embeddings:
                try:
                    emb = np.array(json.loads(item["embedding"]))
                    embeddings.append(emb)
                    valid_tickets.append(item)
                except:
                    continue

            if len(embeddings) < self.cluster_min_size:
                return []

            embeddings = np.array(embeddings)

            similarity_matrix = np.dot(embeddings, embeddings.T)
            norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
            similarity_matrix = similarity_matrix / (norms * norms.T)

            np.fill_diagonal(similarity_matrix, 0)

            visited = set()
            clusters = []

            for i in range(len(embeddings)):
                if i in visited:
                    continue

                cluster = [i]
                visited.add(i)

                for j in range(i + 1, len(embeddings)):
                    if (
                        j not in visited
                        and similarity_matrix[i, j] >= self.similarity_threshold
                    ):
                        cluster.append(j)
                        visited.add(j)

                if len(cluster) >= self.cluster_min_size:
                    clusters.append(cluster)

            alerts = []
            for cluster in clusters:
                cluster_tickets = [valid_tickets[idx] for idx in cluster]

                representative = min(
                    cluster_tickets, key=lambda t: t.get("created_at", datetime.min)
                )

                categories = [
                    t.get("category") for t in cluster_tickets if t.get("category")
                ]
                most_common_category = (
                    max(set(categories), key=categories.count)
                    if categories
                    else "Application"
                )

                alert = {
                    "cluster_size": len(cluster),
                    "representative_title": representative.get("title", "Unknown"),
                    "category": most_common_category,
                    "time_window_days": self.window_days,
                    "ticket_ids": [t["id"] for t in cluster_tickets],
                }
                alerts.append(alert)
            
            span.set_attribute("pattern.tickets_analyzed", len(valid_tickets))
            span.set_attribute("pattern.clusters_found", len(clusters))
            span.set_attribute("pattern.alerts_generated", len(alerts))

            return alerts


pattern_detection_service = PatternDetectionService()
