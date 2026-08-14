import os
import uuid
from datetime import datetime
from typing import Optional
from urllib.parse import urlparse

from fastapi import UploadFile

from app.core.config import settings


class R2StorageService:
    def __init__(self):
        self.use_r2 = True
        self.bucket_name = settings.R2_BUCKET_NAME
        self.endpoint_url = settings.R2_ENDPOINT_URL.rstrip("/") if settings.R2_ENDPOINT_URL else ""
        self.public_base_url = settings.R2_PUBLIC_BASE_URL.rstrip("/") if settings.R2_PUBLIC_BASE_URL else ""
        self.signed_url_expiration = settings.R2_SIGNED_URL_EXPIRATION
        self._client = None

    def _get_client(self):
        if self._client is not None:
            return self._client
        try:
            import boto3
        except ImportError as exc:
            raise ValueError("boto3 is required for R2 uploads. Add boto3 to requirements.") from exc

        missing = []
        if not settings.R2_ACCESS_KEY_ID:
            missing.append("R2_ACCESS_KEY_ID")
        if not settings.R2_SECRET_ACCESS_KEY:
            missing.append("R2_SECRET_ACCESS_KEY")
        if not settings.R2_ENDPOINT_URL:
            missing.append("R2_ENDPOINT_URL")
        if not settings.R2_BUCKET_NAME:
            missing.append("R2_BUCKET_NAME")
        if missing:
            raise ValueError(f"Missing R2 configuration: {', '.join(missing)}")

        self._client = boto3.client(
            "s3",
            endpoint_url=settings.R2_ENDPOINT_URL,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name="auto",
        )
        return self._client

    def _safe_filename(self, filename: Optional[str]) -> str:
        if not filename:
            return "file"
        base = os.path.basename(filename).strip()
        return base.replace(" ", "_")

    def _build_key(self, folder: str, owner_id: str, filename: Optional[str]) -> str:
        safe_name = self._safe_filename(filename)
        stamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        return f"{folder}/{owner_id}/{stamp}_{uuid.uuid4().hex}_{safe_name}"

    def upload_upload_file(self, file: UploadFile, folder: str, owner_id: str) -> tuple[str, int]:
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)

        if file_size > settings.MAX_UPLOAD_SIZE:
            raise ValueError(
                f"File size exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE} bytes"
            )

        client = self._get_client()
        key = self._build_key(folder=folder, owner_id=owner_id, filename=file.filename)
        put_kwargs = {
            "Bucket": self.bucket_name,
            "Key": key,
            "Body": file.file,
        }
        if file.content_type:
            put_kwargs["ContentType"] = file.content_type
        client.put_object(**put_kwargs)
        # Persist object key. Temporary signed URLs are generated on read.
        return key, file_size

    def _extract_key_from_reference(self, file_reference: str) -> Optional[str]:
        if not file_reference:
            return None
        if self.public_base_url and file_reference.startswith(f"{self.public_base_url}/"):
            return file_reference.replace(f"{self.public_base_url}/", "", 1)

        if self.endpoint_url and file_reference.startswith(f"{self.endpoint_url}/{self.bucket_name}/"):
            return file_reference.replace(f"{self.endpoint_url}/{self.bucket_name}/", "", 1)

        # If it already looks like a key, use as-is.
        if "://" not in file_reference and not file_reference.startswith("/"):
            return file_reference

        parsed = urlparse(file_reference)
        path = parsed.path.lstrip("/")
        if path.startswith(f"{self.bucket_name}/"):
            return path.replace(f"{self.bucket_name}/", "", 1)
        return None

    def delete_file(self, file_reference: Optional[str]) -> None:
        if not file_reference:
            return

        key = self._extract_key_from_reference(file_reference)
        if not key:
            return
        client = self._get_client()
        client.delete_object(Bucket=self.bucket_name, Key=key)

    def generate_signed_url(self, file_reference: Optional[str], expires_in: Optional[int] = None) -> Optional[str]:
        if not file_reference:
            return None
        key = self._extract_key_from_reference(file_reference)
        if not key:
            return None

        client = self._get_client()
        expiration = expires_in if expires_in is not None else self.signed_url_expiration
        if not expiration or expiration <= 0:
            expiration = 3600

        return client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": self.bucket_name,
                "Key": key,
            },
            ExpiresIn=expiration,
        )
