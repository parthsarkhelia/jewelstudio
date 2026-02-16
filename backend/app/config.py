from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://ijewel:ijewel_dev@localhost:5432/ijewel"
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://ijewel:ijewel_dev@localhost:5432/ijewel"
    REDIS_URL: str = "redis://localhost:6379/0"

    S3_ENDPOINT: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "ijewel"
    S3_SECRET_KEY: str = "ijewel_dev"
    S3_BUCKET_MODELS: str = "ijewel-models"
    S3_BUCKET_THUMBNAILS: str = "ijewel-thumbnails"
    S3_BUCKET_EXPORTS: str = "ijewel-exports"
    S3_REGION: str = "us-east-1"

    AUTH_SECRET: str = "dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"

    MAX_UPLOAD_SIZE_MB: int = 100
    MAX_TRIANGLES: int = 500_000

    FRONTEND_URL: str = "http://localhost:3000"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
