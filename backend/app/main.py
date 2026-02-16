from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import upload, conversion, processing, thumbnail


def create_app() -> FastAPI:
    app = FastAPI(
        title="iJewel 3D Processing API",
        version="0.1.0",
        docs_url="/api/v1/docs",
        openapi_url="/api/v1/openapi.json",
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
        return {"status": "ok", "service": "ijewel-backend"}

    return app


app = create_app()
