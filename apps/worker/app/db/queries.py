import json
import logging
from typing import Any

from app.db.database import get_pool

logger = logging.getLogger(__name__)


async def update_image_status(
    *,
    image_id: str,
    status: str,
    face_count: int = 0,
    error_message: str | None = None,
) -> None:
    """Update ``images.status``, ``face_count``, and optional ``error_message``."""
    pool = get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE images
               SET status        = $1::image_status,
                   face_count    = $2,
                   error_message = $3,
                   updated_at    = NOW()
             WHERE id = $4::uuid
            """,
            status,
            face_count,
            error_message,
            image_id,
        )


async def insert_face(
    *,
    image_id: str,
    user_id: str,
    tenant_id: str,
    bounding_box: dict[str, Any],
    landmarks: list | None,
) -> str:
    """Insert a detected face row and return its UUID string."""
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO faces (image_id, user_id, tenant_id, bounding_box, landmarks)
            VALUES ($1::uuid, $2::uuid, $3::uuid, $4::jsonb, $5::jsonb)
            RETURNING id
            """,
            image_id,
            user_id,
            tenant_id,
            json.dumps(bounding_box),
            json.dumps(landmarks) if landmarks is not None else None,
        )
    return str(row["id"])


async def insert_embedding(
    *,
    face_id: str,
    image_id: str,
    user_id: str,
    tenant_id: str,
    embedding: list[float],
) -> None:
    """
    Insert a 512-dim ArcFace embedding as a pgvector column.

    pgvector expects text in the form ``'[f1,f2,...,f512]'``.  We cast with
    ``$5::vector`` inside the SQL so PostgreSQL performs the text→vector
    conversion; asyncpg transmits the parameter as plain text.
    """
    pool = get_pool()
    vec_str = "[" + ",".join(str(v) for v in embedding) + "]"
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO face_embeddings
                (face_id, image_id, user_id, tenant_id, embedding)
            VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::vector)
            """,
            face_id,
            image_id,
            user_id,
            tenant_id,
            vec_str,
        )
