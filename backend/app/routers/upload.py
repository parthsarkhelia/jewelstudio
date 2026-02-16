import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Model3D, ProcessingStatus
from app.schemas.upload import UploadResponse, UploadStatusResponse
from app.services.storage_service import storage_service
from app.services.conversion_service import SUPPORTED_IMPORT_FORMATS
from app.utils.auth import get_current_user
from app.config import settings
from app.workers.tasks import process_upload

router = APIRouter(tags=["upload"])

ALLOWED_EXTENSIONS = {ext.lstrip(".") for ext in SUPPORTED_IMPORT_FORMATS}


@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    name: str = Form(None),
    description: str = Form(None),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = Path(file.filename).suffix.lower().lstrip(".")
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format: .{ext}. Supported: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large. Max {settings.MAX_UPLOAD_SIZE_MB}MB")

    model_id = str(uuid.uuid4())
    upload_key = storage_service.generate_upload_key(user["id"], file.filename)

    storage_service.upload_bytes(content, settings.S3_BUCKET_MODELS, upload_key, file.content_type)

    model = Model3D(
        id=model_id,
        user_id=user["id"],
        name=name or Path(file.filename).stem,
        description=description,
        original_file_url=f"{settings.S3_ENDPOINT}/{settings.S3_BUCKET_MODELS}/{upload_key}",
        original_format=ext,
        processing_status=ProcessingStatus.PENDING.value,
        file_size=len(content),
    )
    db.add(model)
    await db.commit()

    task = process_upload.delay(model_id, upload_key, ext)

    model.celery_task_id = task.id
    await db.commit()

    return UploadResponse(
        model_id=model_id,
        task_id=task.id,
        status="PENDING",
        message="File uploaded, processing started",
    )


@router.get("/upload/status/{task_id}", response_model=UploadStatusResponse)
async def upload_status(task_id: str, user: dict = Depends(get_current_user)):
    from celery.result import AsyncResult

    result = AsyncResult(task_id)

    response = UploadStatusResponse(task_id=task_id, status=result.status)

    if result.ready() and result.successful():
        data = result.result
        response.status = data.get("status", "completed").upper()
        response.model_id = data.get("model_id")
    elif result.failed():
        response.status = "FAILED"
        response.error = str(result.result)

    return response
