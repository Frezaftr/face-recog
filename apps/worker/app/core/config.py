from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # ── Kafka ────────────────────────────────────────────────
    kafka_brokers: str = "kafka:29092"
    kafka_group_id: str = "worker-group"
    kafka_topic: str = "image.uploaded"

    # ── Database ─────────────────────────────────────────────
    database_url: str

    # ── MinIO ────────────────────────────────────────────────
    minio_endpoint: str = "minio"
    minio_port: int = 9000
    minio_access_key: str
    minio_secret_key: str
    minio_bucket: str = "images"
    minio_secure: bool = False

    # ── Face service ─────────────────────────────────────────
    face_service_url: str = "http://face-service:8000"

    # ── Worker ───────────────────────────────────────────────
    worker_concurrency: int = 4
    log_level: str = "info"


settings = Settings()
