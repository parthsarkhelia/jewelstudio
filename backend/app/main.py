import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers import upload, conversion, processing, thumbnail

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting JewelStudio backend")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables ensured")
    yield
    logger.info("Shutting down JewelStudio backend")


def create_app() -> FastAPI:
    app = FastAPI(
        title="JewelStudio 3D Processing API",
        version="0.1.0",
        docs_url="/api/v1/docs",
        openapi_url="/api/v1/openapi.json",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(upload.router, prefix="/api/v1")
    app.include_router(conversion.router, prefix="/api/v1")
    app.include_router(processing.router, prefix="/api/v1")
    app.include_router(thumbnail.router, prefix="/api/v1")

    @app.get("/api/v1/health")
    async def health():
        return {"status": "ok", "service": "jewelstudio-backend"}

    return app


app = create_app()
