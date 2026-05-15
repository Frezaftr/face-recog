import logging
from typing import Any

from app.db.queries import insert_embedding, insert_face, update_image_status
from app.services.face_client import FaceClient
from app.services.storage_client import StorageClient

logger = logging.getLogger(__name__)


class ImageHandler:
    """
    Handles a single ``image.uploaded`` Kafka event end-to-end.

    Data flow::

        MinIO (raw bytes)
          → face-service POST /process
          → PostgreSQL INSERT faces + face_embeddings
          → PostgreSQL UPDATE images SET status='done'|'failed'
    """

    def __init__(self) -> None:
        self._storage = StorageClient()
        self._face_client = FaceClient()

    async def handle(self, event: dict[str, Any]) -> None:
        image_id: str = event["imageId"]
        storage_key: str = event["storageKey"]
        user_id: str = event["userId"]
        tenant_id: str = event["tenantId"]

        logger.info("Processing image %s (key=%s)", image_id, storage_key)

        try:
            # 1. Download raw image bytes from MinIO
            image_bytes = await self._storage.get_object(storage_key)

            # 2. Send to face-service — get bbox + landmarks + embeddings
            faces = await self._face_client.process(image_bytes)

            # 3. Persist each detected face and its embedding
            for face in faces:
                face_id = await insert_face(
                    image_id=image_id,
                    user_id=user_id,
                    tenant_id=tenant_id,
                    bounding_box=face["bbox"],
                    landmarks=face.get("landmarks"),
                )
                await insert_embedding(
                    face_id=face_id,
                    image_id=image_id,
                    user_id=user_id,
                    tenant_id=tenant_id,
                    embedding=face["embedding"],
                )

            # 4. Mark image as processed
            await update_image_status(
                image_id=image_id,
                status="done",
                face_count=len(faces),
            )
            logger.info(
                "Image %s done — %d face(s) detected", image_id, len(faces)
            )

        except Exception as exc:
            logger.exception("Failed to process image %s: %s", image_id, exc)
            # Best-effort status update; do not re-raise so the offset is committed
            try:
                await update_image_status(
                    image_id=image_id,
                    status="failed",
                    error_message=str(exc),
                )
            except Exception:
                logger.exception(
                    "Could not update status to 'failed' for image %s", image_id
                )
            raise  # bubble up so consumer logs the error
