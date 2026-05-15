import asyncio
import logging

from minio import Minio

from app.core.config import settings

logger = logging.getLogger(__name__)


class StorageClient:
    """
    Async wrapper around the synchronous MinIO Python SDK.

    MinIO I/O is CPU-bound on the first call (DNS + TCP) then mostly network
    I/O.  We delegate to ``asyncio.to_thread`` so the event loop is never
    blocked.
    """

    def __init__(self) -> None:
        self._client = Minio(
            f"{settings.minio_endpoint}:{settings.minio_port}",
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
        )

    async def get_object(self, storage_key: str) -> bytes:
        """Return raw image bytes for *storage_key* from the configured bucket."""
        return await asyncio.to_thread(self._sync_get, storage_key)

    def _sync_get(self, storage_key: str) -> bytes:
        response = self._client.get_object(settings.minio_bucket, storage_key)
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()
