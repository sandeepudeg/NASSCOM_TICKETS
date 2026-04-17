graph LR
    %% Data Sources
    subgraph DataSources ["Data Acquisition"]
        KaggleDatasets[Kaggle API<br/>(Categorization, ServiceNow Logs)]
        SupportMultilingual[Multilingual Support Tickets]
        HistoricalData[Company Historical Ticket Data]
    end

    %% Data Pipeline/Preprocessing
    subgraph Preprocessing ["Data Preprocessing"]
        DataService[Data Management & Cleansing Service]
        PII[PII Scrubbing]
    end

    %% Model Lifecycle
    subgraph MLOps ["Model Lifecycle (MLflow)"]
        TrainingLoop[Training & Fine-tuning]
        ModelReg[(Model Registry)]
        A_B_Test[Deployment & Rollback Logic]
    end

    %% Vectorization/Serving
    subgraph Vectorization ["Embedding Generation"]
        EmbedEngine[Embedding Engine<br/>(via Ollama)]
        VectorDB[(Vector Database)]
    end

    %% Quality Metrics Check
    subgraph Metrics ["Quality Metrics & Targets"]
        F1_Score["Macro F1 >= 0.80"]
        SemanticScore["Mean Semantic Similarity >= 0.72"]
        JudgeScore["LLM-as-Judge Score >= 3.5/5"]
    end

    %% Production Data
    subgraph ProductionData ["Active Production Data"]
        PostgresProd[(Production Postgres)]
    end

    %% Flow/Connections
    DataSources --> DataService
    DataService --> PII
    PII --> TrainingLoop
    
    TrainingLoop --> F1_Score
    F1_Score --> ModelReg
    
    ModelReg --> A_B_Test
    A_B_Test --> EmbedEngine
    
    EmbedEngine --> SemanticScore
    SemanticScore --> VectorDB
    
    A_B_Test --> JudgeScore
    JudgeScore --> ProductionData
    
    style Vectorization fill:#e1f5fe,stroke:#0277bd;
    style MLOps fill:#e8f5e9,stroke:#2e7d32;
    style Metrics fill:#fff3e0,stroke:#ef6c00;