import logging
import os
import tempfile

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.config import settings
from app.workers.celery_app import celery_app
from app.models import Model3D, ExportJob, ProcessingStatus, ExportStatus
from app.services.conversion_service import conversion_service
from app.services.storage_service import storage_service
from app.services.thumbnail_service import thumbnail_service

logger = logging.getLogger(__name__)

_engine = create_engine(settings.DATABASE_URL_SYNC, pool_pre_ping=True)


def get_sync_session() -> Session:
    return Session(_engine)


@celery_app.task(bind=True, name="process_upload")
def process_upload(self, model_id: str, original_key: str, original_format: str):
    logger.info("Processing upload model_id=%s format=%s", model_id, original_format)
    session = get_sync_session()
    try:
        model = session.query(Model3D).filter(Model3D.id == model_id).first()
        if not model:
            logger.error("Model not found: %s", model_id)
            return {"error": "Model not found"}

        model.processing_status = ProcessingStatus.PROCESSING.value
        session.commit()

        # Download original file
        with tempfile.NamedTemporaryFile(suffix=f".{original_format}", delete=False) as tmp:
            tmp_input = tmp.name
        storage_service.download_file(settings.S3_BUCKET_MODELS, original_key, tmp_input)

        # Convert to GLB
        glb_path = conversion_service.convert_to_glb(tmp_input)

        # Get mesh info
        mesh_info = conversion_service.get_mesh_info(glb_path)

        # Optimize if needed
        if mesh_info["total_faces"] > settings.MAX_TRIANGLES:
            logger.info("Optimizing mesh: %d faces > %d max", mesh_info["total_faces"], settings.MAX_TRIANGLES)
            glb_path = conversion_service.optimize_mesh(glb_path, settings.MAX_TRIANGLES)
            mesh_info = conversion_service.get_mesh_info(glb_path)

        # Upload GLB
        glb_key = f"glb/{model.user_id}/{model_id}.glb"
        glb_url = storage_service.upload_file(
            glb_path, settings.S3_BUCKET_MODELS, glb_key, "model/gltf-binary"
        )

        # Generate thumbnail
        try:
            thumb_path = thumbnail_service.generate_thumbnail(glb_path)
            thumb_key = f"thumbnails/{model_id}.png"
            thumb_url = storage_service.upload_file(
                thumb_path, settings.S3_BUCKET_THUMBNAILS, thumb_key, "image/png"
            )
            model.thumbnail_url = thumb_url
            os.unlink(thumb_path)
        except Exception as e:
            logger.warning("Thumbnail generation failed for model_id=%s: %s", model_id, e)

        # Update model
        model.glb_file_url = glb_url
        model.processing_status = ProcessingStatus.COMPLETED.value
        model.vertex_count = mesh_info["total_vertices"]
        model.face_count = mesh_info["total_faces"]
        session.commit()

        # Cleanup
        os.unlink(tmp_input)
        os.unlink(glb_path)

        logger.info("Upload processing completed model_id=%s", model_id)
        return {"status": "completed", "model_id": model_id}

    except Exception as e:
        logger.exception("Upload processing failed model_id=%s", model_id)
        model = session.query(Model3D).filter(Model3D.id == model_id).first()
        if model:
            model.processing_status = ProcessingStatus.FAILED.value
            model.processing_error = str(e)
            session.commit()
        return {"status": "failed", "error": str(e)}
    finally:
        session.close()


@celery_app.task(bind=True, name="process_export")
def process_export(self, job_id: str, model_id: str, target_format: str):
    logger.info("Processing export job_id=%s model_id=%s format=%s", job_id, model_id, target_format)
    session = get_sync_session()
    try:
        job = session.query(ExportJob).filter(ExportJob.id == job_id).first()
        if not job:
            logger.error("Export job not found: %s", job_id)
            return {"error": "Job not found"}

        job.status = ExportStatus.PROCESSING.value
        session.commit()

        model = session.query(Model3D).filter(Model3D.id == model_id).first()
        if not model or not model.glb_file_url:
            raise ValueError("Model or GLB file not found")

        # Download GLB
        glb_key = f"glb/{model.user_id}/{model_id}.glb"
        with tempfile.NamedTemporaryFile(suffix=".glb", delete=False) as tmp:
            tmp_input = tmp.name
        storage_service.download_file(settings.S3_BUCKET_MODELS, glb_key, tmp_input)

        # Convert
        output_path = conversion_service.convert_format(tmp_input, target_format)

        # Upload result
        export_key = f"exports/{model_id}/{job_id}.{target_format}"
        result_url = storage_service.upload_file(
            output_path, settings.S3_BUCKET_EXPORTS, export_key
        )

        job.status = ExportStatus.COMPLETED.value
        job.result_url = result_url
        session.commit()

        os.unlink(tmp_input)
        os.unlink(output_path)

        logger.info("Export completed job_id=%s", job_id)
        return {"status": "completed", "job_id": job_id}

    except Exception as e:
        logger.exception("Export failed job_id=%s", job_id)
        job = session.query(ExportJob).filter(ExportJob.id == job_id).first()
        if job:
            job.status = ExportStatus.FAILED.value
            job.error = str(e)
            session.commit()
        return {"status": "failed", "error": str(e)}
    finally:
        session.close()
