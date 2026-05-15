import asyncio
import logging
import signal

from app.consumer import ImageConsumer
from app.core.config import settings

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


async def main() -> None:
    consumer = ImageConsumer()
    loop = asyncio.get_running_loop()
    stop_event = asyncio.Event()

    def _handle_signal() -> None:
        logger.info("Shutdown signal received — finishing current batch …")
        stop_event.set()

    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, _handle_signal)

    await consumer.start()
    logger.info(
        "Worker started (topic=%s, group=%s, concurrency=%d)",
        settings.kafka_topic,
        settings.kafka_group_id,
        settings.worker_concurrency,
    )

    try:
        await consumer.run(stop_event)
    finally:
        await consumer.stop()
        logger.info("Worker stopped cleanly")


if __name__ == "__main__":
    asyncio.run(main())
