from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    app_name: str = "TicketsFolder"
    app_version: str = "1.0.0"
    debug: bool = False

    database_url: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/tickets"
    )
    database_pool_size: int = 20
    database_max_overflow: int = 10

    vector_dimension: int = 384

    api_v1_prefix: str = "/api/v1"
    host: str = "0.0.0.0"
    port: int = 8000

    multi_folder_assignment: bool = False

    escalation_threshold: float = 0.65
    classification_timeout_seconds: int = 30

    embedding_model: str = "all-MiniLM-L6-v2"

    similarity_threshold: float = 0.70
    top_k_similar_tickets: int = 5

    pattern_window_days: int = 7
    pattern_similarity_threshold: float = 0.80
    pattern_cluster_min_size: int = 3

    retrain_schedule_cron: str = "0 2 * * 0"

    disable_pii_scrubbing: bool = False

    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2:latest"
    groq_api_key: str | None = None
    groq_model: str = "llama-3.3-70b-versatile"

    mlflow_tracking_uri: str = "http://localhost:5000"
    mlflow_enabled: bool = True

    object_storage_endpoint: str = "http://localhost:9000"
    object_storage_access_key: str = "minioadmin"
    object_storage_secret_key: str = "minioadmin"
    object_storage_bucket: str = "tickets"

    auth_service_url: str = "http://localhost:8080/auth"
    token_expiry_minutes: int = 15
    refresh_token_expiry_hours: int = 8

    escalation_webhook_url: str = "http://localhost:9000/webhook/escalation"
    webhook_retry_max: int = 3
    webhook_retry_initial_delay_seconds: int = 10

    observability_webhook_url: str = "http://localhost:9000/webhook/observability"

    rate_limit_standard: int = 300
    rate_limit_service_account: int = 1000

    prometheus_enabled: bool = True
    otel_exporter_otlp_endpoint: str = "http://localhost:4317"
    jaeger_endpoint: str = "http://localhost:14268"
    loki_endpoint: str = "http://localhost:3100"


settings = Settings()
