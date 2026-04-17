import asyncio
from src.ml.embedding_service import embedding_service

async def test():
    text1 = "Database connection timeout. The application is unable to connect to the database. We are seeing connection timeout errors in the logs."
    text2 = "Database connection timeout. The application is unable to connect to the database. We are seeing connection timeout errors in the logs. Restarted the DB service and things are back to normal."
    
    emb1 = embedding_service.get_embedding(text1)
    emb2 = embedding_service.get_embedding(text2)
    
    import numpy as np
    norm1 = np.linalg.norm(emb1)
    norm2 = np.linalg.norm(emb2)
    similarity = np.dot(emb1, emb2) / (norm1 * norm2)
    print(f"Similarity: {similarity}")

if __name__ == "__main__":
    asyncio.run(test())
