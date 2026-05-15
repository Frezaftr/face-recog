import asyncio
import json
import logging
from typing import Any

from aiokafka import AIOKafkaConsumer
from aiokafka.structs import OffsetAndMetadata, TopicPartition

from app.core.config import settings
from app.db.database import close_pool, init_pool
from app.handlers.image_handler import ImageHandler

logger = logging.getLogger(__name__)


class ImageConsumer:
    """
    Async Kafka consumer for the ``image.uploaded`` topic.

    Commit strategy: manual commit per mini-batch — at-least-once delivery.
    Offset is committed only *after* all tasks in the batch finish (success or
    failure). Failed images are marked ``status='failed'`` in the DB so we do
    not reprocess them on the next consumer restart.

    Concurrency: up to ``settings.worker_concurrency`` messages processed in
    parallel per poll cycle via ``asyncio.gather``.
    """

    def __init__(self) -> None:
        self._consumer: AIOKafkaConsumer | None = None
        self._handler = ImageHandler()

    # ── Lifecycle ────────────────────────────────────────────

    async def start(self) -> None:
        await init_pool()
        self._consumer = AIOKafkaConsumer(
            settings.kafka_topic,
            bootstrap_servers=settings.kafka_brokers,
            group_id=settings.kafka_group_id,
            enable_auto_commit=False,
            auto_offset_reset="earliest",
            value_deserializer=lambda raw: json.loads(raw.decode("utf-8")),
        )
        await self._consumer.start()
        logger.info(
            "Kafka consumer subscribed to '%s' (group=%s)",
            settings.kafka_topic,
            settings.kafka_group_id,
        )

    async def stop(self) -> None:
        if self._consumer:
            await self._consumer.stop()
        await close_pool()

    # ── Main loop ────────────────────────────────────────────

    async def run(self, stop_event: asyncio.Event) -> None:
        assert self._consumer, "Call start() first"

        while not stop_event.is_set():
            try:
                records: dict[TopicPartition, list[Any]] = (
                    await self._consumer.getmany(
                        timeout_ms=500,
                        max_records=settings.worker_concurrency,
                    )
                )
            except asyncio.CancelledError:
                break
            except Exception:
                logger.exception("Consumer poll error — retrying in 2 s")
                await asyncio.sleep(2)
                continue

            if not records:
                continue

            for tp, messages in records.items():
                if not messages:
                    continue

                # Process all messages in the batch concurrently.
                # _safe_handle never raises — errors are persisted to DB.
                tasks = [
                    asyncio.create_task(self._safe_handle(msg.value))
                    for msg in messages
                ]
                await asyncio.gather(*tasks)

                # Commit the highest offset in this partition slice.
                commit_offset = OffsetAndMetadata(messages[-1].offset + 1, "")
                await self._consumer.commit({tp: commit_offset})
                logger.debug(
                    "Committed %s → offset %d", tp, messages[-1].offset + 1
                )

    # ── Helpers ──────────────────────────────────────────────

    async def _safe_handle(self, event: dict) -> None:
        try:
            await self._handler.handle(event)
        except Exception:
            logger.exception(
                "Unhandled error for event imageId=%s", event.get("imageId")
            )
