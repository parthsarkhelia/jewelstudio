import tempfile

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Model3D
from app.schemas.mesh import MeshInfoResponse, MeshPart
from app.services.conversion_service import conversion_service
from app.services.storage_service import storage_service
from app.utils.auth import get_current_user
from app.config import settings

router = APIRouter(tags=["processing"])


@router.get("/mesh/{model_id}/info", response_model=MeshInfoResponse)
async def mesh_info(
    model_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Model3D).where(Model3D.id == model_id))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    if model.user_id != user["id"] and model.visibility == "PRIVATE":
        raise HTTPException(status_code=403, detail="Not authorized")
    if not model.glb_file_url:
        raise HTTPException(status_code=400, detail="Model not yet processed")

    glb_key = f"glb/{model.user_id}/{model_id}.glb"
    tmp_path = tempfile.mktemp(suffix=".glb")

    try:
        storage_service.download_file(settings.S3_BUCKET_MODELS, glb_key, tmp_path)
        info = conversion_service.get_mesh_info(tmp_path)
    finally:
        import os
        os.unlink(tmp_path)

    return MeshInfoResponse(
        model_id=model_id,
        total_vertices=info["total_vertices"],
        total_faces=info["total_faces"],
        parts=[MeshPart(**p) for p in info["parts"]],
    )
