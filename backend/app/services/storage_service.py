import uuid
from pathlib import Path

import boto3
from botocore.config import Config

from app.config import settings


class StorageService:
    def __init__(self):
        self.s3 = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            region_name=settings.S3_REGION,
            config=Config(signature_version="s3v4"),
        )

    def upload_file(self, file_path: str, bucket: str, key: str, content_type: str = None) -> str:
        extra_args = {}
        if content_type:
            extra_args["ContentType"] = content_type
        self.s3.upload_file(file_path, bucket, key, ExtraArgs=extra_args)
        return f"{settings.S3_ENDPOINT}/{bucket}/{key}"

    def upload_bytes(self, data: bytes, bucket: str, key: str, content_type: str = None) -> str:
        extra_args = {}
        if content_type:
            extra_args["ContentType"] = content_type
        self.s3.put_object(Body=data, Bucket=bucket, Key=key, **extra_args)
        return f"{settings.S3_ENDPOINT}/{bucket}/{key}"

    def download_file(self, bucket: str, key: str, local_path: str) -> str:
        self.s3.download_file(bucket, key, local_path)
        return local_path

    def generate_presigned_url(self, bucket: str, key: str, expires_in: int = 3600) -> str:
        return self.s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=expires_in,
        )

    def generate_upload_key(self, user_id: str, filename: str, prefix: str = "originals") -> str:
        ext = Path(filename).suffix.lower()
        unique_name = f"{uuid.uuid4()}{ext}"
        return f"{prefix}/{user_id}/{unique_name}"


storage_service = StorageService()
