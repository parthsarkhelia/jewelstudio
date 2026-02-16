import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Model3D, ExportJob, ExportStatus
from app.schemas.conversion import ConversionRequest, ConversionResponse, ConversionStatusResponse
from app.services.storage_service import storage_service
from app.services.conversion_service import SUPPORTED_EXPORT_FORMATS
from app.utils.auth import get_current_user
from app.config import settings
from app.workers.tasks import process_export

router = APIRouter(tags=["conversion"])


@router.post("/convert", response_model=ConversionResponse)
async def request_conversion(
    req: ConversionRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    target_ext = f".{req.target_format.lower().lstrip('.')}"
    if target_ext not in SUPPORTED_EXPORT_FORMATS:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {req.target_format}")

    result = await db.execute(select(Model3D).where(Model3D.id == req.model_id))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    if model.user_id != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if not model.glb_file_url:
        raise HTTPException(status_code=400, detail="Model not yet processed")

    job_id = str(uuid.uuid4())
    job = ExportJob(
        id=job_id,
        model_id=req.model_id,
        target_format=req.target_format.lower().lstrip("."),
        status=ExportStatus.PENDING.value,
    )
    db.add(job)
    await db.commit()

    task = process_export.delay(job_id, req.model_id, req.target_format)
    job.celery_task_id = task.id
    await db.commit()

    return ConversionResponse(
        job_id=job_id,
        status="PENDING",
        message="Conversion started",
    )


@router.get("/convert/{job_id}", response_model=ConversionStatusResponse)
async def conversion_status(
    job_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ExportJob).where(ExportJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    download_url = None
    if job.status == ExportStatus.COMPLETED.value and job.result_url:
        export_key = f"exports/{job.model_id}/{job.id}.{job.target_format}"
        download_url = storage_service.generate_presigned_url(settings.S3_BUCKET_EXPORTS, export_key)

    return ConversionStatusResponse(
        job_id=job.id,
        status=job.status,
        target_format=job.target_format,
        download_url=download_url,
        error=job.error,
    )
