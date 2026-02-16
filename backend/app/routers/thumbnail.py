import os
import tempfile

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Model3D
from app.services.storage_service import storage_service
from app.services.thumbnail_service import thumbnail_service
from app.utils.auth import get_current_user
from app.config import settings

router = APIRouter(tags=["thumbnail"])


@router.post("/thumbnail/{model_id}")
async def regenerate_thumbnail(
    model_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Model3D).where(Model3D.id == model_id))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    if model.user_id != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if not model.glb_file_url:
        raise HTTPException(status_code=400, detail="Model not yet processed")

    glb_key = f"glb/{model.user_id}/{model_id}.glb"
    tmp_glb = tempfile.mktemp(suffix=".glb")

    try:
        storage_service.download_file(settings.S3_BUCKET_MODELS, glb_key, tmp_glb)
        thumb_path = thumbnail_service.generate_thumbnail(tmp_glb)

        thumb_key = f"thumbnails/{model_id}.png"
        thumb_url = storage_service.upload_file(
            thumb_path, settings.S3_BUCKET_THUMBNAILS, thumb_key, "image/png"
        )

        model.thumbnail_url = thumb_url
        await db.commit()

        os.unlink(thumb_path)
    finally:
        os.unlink(tmp_glb)

    return {"status": "ok", "thumbnail_url": thumb_url}
