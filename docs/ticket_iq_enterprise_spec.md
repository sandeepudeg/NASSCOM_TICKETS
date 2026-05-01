# TicketIQ: Enterprise Neural Intelligence Architecture

This document outlines the professional technical architecture of TicketIQ, an AIOps-driven Service Management framework. It focuses on modular scalability, data sovereignty, and reliable automated ticket orchestration.

---

## Part 1: System Infrastructure & Architecture
**The Core Foundation**

TicketIQ follows a **Microservices-based architecture** encapsulated in Docker containers. This ensures environment parity from local development to production. The system is brokered by **Traefik**, which serves as the high-availability API Gateway, managing entry points for all client requests.

The backend is built with **FastAPI**, leveraging Python's asynchronous capabilities to handle high-frequency AI inferences without blocking the primary request-response cycle. This architecture allows the system to scale horizontally by deploying multiple instances of the API and ML workers as traffic increases.

### Architecture Map
```mermaid
graph TD
    Client[Web/API Client] --> Gateway[Traefik Gateway]
    Gateway --> API[FastAPI Core]
    API --> LLM[Ollama ML Engine]
    API --> PG[(PostgreSQL + pgvector)]
    API --> Store[MinIO Object Store]
    API --> Auth[Keycloak Auth]
```

![Architecture Professional](solution_architecture_professional.png)

---

## Part 2: Neural Classification Pipeline
**Reliability-First Inference**

The classification pipeline is designed for high precision. When a ticket is received, it undergoes a multi-stage analysis:
1.  **Metadata Extraction**: Identifying title and description signals.
2.  **Semantic Enrichment**: Scrubbing PII and parsing structured causal data.
3.  **LLM Inference**: Categorizing the issue using Chain-of-Thought (CoT) logic.
4.  **Confidence Assessment**: Each inference is assigned a confidence score. If the score is marginal, the system triggers an **LLM-as-a-Judge** validation to confirm or flag the ticket for human review.

### Sequence Diagram: Classification Flow
```mermaid
sequenceDiagram
    participant User
    participant API as FastAPI Backend
    participant AI as Ollama ML
    participant DB as Postgres
    
    User->>API: Post Ticket
    API->>AI: Perform CoT Classification
    AI-->>API: Result (Category + Confidence)
    API->>DB: Persist Record
    API-->>User: Ticket Successfully Routed
```

![Sequence Professional](sequence_diagram_professional.png)

---

## Part 3: Data Engineering & Governance
**Secure Pipeline Management**

Data integrity and privacy are the core of TicketIQ. The **Data Engineering Pipeline** ensures that every ticket is sanitized before it reaches the permanent vector store. 

The pipeline implements a **PII Scrubber** that redacts sensitive identifiers. Following sanitation, the **Embedding Service** converts the text into 768-dimensional vectors. These vectors are then indexed in **pgvector**, allowing for sub-second semantic retrieval across millions of historical records.

### Data Flow Diagram (DFD)
```mermaid
graph LR
    Input[Raw Data] --> Scrub[PII Sanitization]
    Scrub --> Embed[Vector Embedding]
    Embed --> Index[pgvector Indexing]
    Index --> Retrieval[RAG Logic]
```

![Data Flow Professional](data_engineering_flow_professional.png)

---

## Part 4: The Neural Matrix (Data Model)
**Relational & Vector Hybrid Schema**

The database schema is a hybrid model designed for both transactional reliability and intelligence discovery. The **Ticket** entity remains the source of truth, linked to specialized tables for AI metrics.

*   **TicketEmbedding**: Stores high-dimensional representations for RAG.
*   **SimilarTicket**: Maps historical relationships detected during inference.
*   **AuditSnapshot**: Captures point-in-time states for compliance.

### Entity Relationship Diagram (ERD)
```mermaid
erDiagram
    TICKET ||--o{ TICKET_EMBEDDING : "has"
    TICKET ||--o{ SIMILAR_TICKET : "references"
    FOLDER ||--o{ TICKET : "categorized"
    USER ||--o{ FOLDER : "owns"
```

![ERD Professional](erd_professional.png)

---

## Part 5: Operational Lifecycle
**State Transition Management**

TicketIQ manages the entire ticket lifecycle from ingestion to resolution. The **State Engine** ensures that every transition is logged and verified. For example, a ticket in the `Escalated` state requires a human review or a specific high-confidence AI resolution before it can move to `Resolved`.

### State Transition Diagram
```mermaid
stateDiagram-v2
    [*] --> Pending
    Pending --> Classified
    Pending --> Escalated
    Classified --> In_Progress
    In_Progress --> Resolved
    Resolved --> [*]
```

![State Professional](state_transition_professional.png)

---

## Part 6: Enterprise Technology Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Backend** | FastAPI | High performance, async support, native Pydantic validation. |
| **Database** | PostgreSQL + pgvector | Industry standard for relational data with native vector support. |
| **ML Engine** | Ollama | Local LLM hosting for data sovereignty and zero latency. |
| **Observability** | Prometheus/Grafana | Standardized metrics and dashboarding for system health. |
| **Auth** | Keycloak | Enterprise-grade OIDC/OAuth2 identity management. |

---
**Standardized Architecture for Scalable AIOps.**
