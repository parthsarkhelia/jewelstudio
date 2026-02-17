from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://jewelstudio:jewelstudio_dev@localhost:5433/jewelstudio"
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://jewelstudio:jewelstudio_dev@localhost:5433/jewelstudio"
    REDIS_URL: str = "redis://localhost:6379/0"

    S3_ENDPOINT: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "jewelstudio"
    S3_SECRET_KEY: str = "jewelstudio_dev"
    S3_BUCKET_MODELS: str = "jewelstudio-models"
    S3_BUCKET_THUMBNAILS: str = "jewelstudio-thumbnails"
    S3_BUCKET_EXPORTS: str = "jewelstudio-exports"
    S3_REGION: str = "us-east-1"

    AUTH_SECRET: str = "dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"

    MAX_UPLOAD_SIZE_MB: int = 100
    MAX_TRIANGLES: int = 500_000

    FRONTEND_URL: str = "http://localhost:3000"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
