from pydantic import BaseModel


class UploadResponse(BaseModel):
    model_id: str
    task_id: str
    status: str
    message: str


class UploadStatusResponse(BaseModel):
    task_id: str
    status: str
    model_id: str | None = None
    thumbnail_url: str | None = None
    glb_file_url: str | None = None
    error: str | None = None
