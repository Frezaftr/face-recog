import io
import logging
from typing import Any

import httpx
from tenacity import (
    before_sleep_log,
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.core.config import settings

logger = logging.getLogger(__name__)


class FaceClient:
    """
    Async HTTP client for the face-service ``/process`` endpoint.

    Retry policy (tenacity):
      - 3 total attempts
      - Exponential back-off: 1 s → 2 s → 4 s (max 8 s)
      - Retries on any ``httpx.HTTPError`` (network errors, timeouts, 5xx)
      - 422 Unprocessable is *not* retried — treated as zero faces detected
    """

    def __init__(self) -> None:
        self._base_url = settings.face_service_url.rstrip("/")
        self._http: httpx.AsyncClient | None = None

    async def _client(self) -> httpx.AsyncClient:
        if self._http is None or self._http.is_closed:
            self._http = httpx.AsyncClient(
                base_url=self._base_url,
                timeout=httpx.Timeout(connect=5.0, read=60.0, write=30.0, pool=5.0),
            )
        return self._http

    @retry(
        retry=retry_if_exception_type(httpx.HTTPError),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,
    )
    async def process(self, image_bytes: bytes) -> list[dict[str, Any]]:
        """
        POST *image_bytes* to ``/process``.

        Returns a list of face dicts with keys ``bbox``, ``landmarks``,
        and ``embedding``.  Raises after all retries if the service is
        unavailable or returns 5xx.
        """
        client = await self._client()
        response = await client.post(
            "/process",
            files={"file": ("image.jpg", io.BytesIO(image_bytes), "image/jpeg")},
        )

        # 5xx → raise so tenacity retries
        if response.status_code >= 500:
            response.raise_for_status()

        # 422 → image unprocessable (no faces / bad format) — do not retry
        if response.status_code == 422:
            logger.warning(
                "face-service returned 422 (unprocessable): %s", response.text
            )
            return []

        response.raise_for_status()
        data = response.json()
        return data.get("faces", [])

    async def close(self) -> None:
        if self._http and not self._http.is_closed:
            await self._http.aclose()
