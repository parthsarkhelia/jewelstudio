from pydantic import BaseModel


class ConversionRequest(BaseModel):
    model_id: str
    target_format: str


class ConversionResponse(BaseModel):
    job_id: str
    status: str
    message: str


class ConversionStatusResponse(BaseModel):
    job_id: str
    status: str
    target_format: str
    download_url: str | None = None
    error: str | None = None
