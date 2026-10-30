import os
import random
import time

from fastapi import HTTPException, status

from logger import logger


def _float_env(name: str, default: float = 0.0) -> float:
    try:
        return float(os.getenv(name, default))
    except ValueError:
        return default


def apply_chaos() -> None:
    delay_ms = _float_env("CHAOS_DELAY_MS")
    error_rate = _float_env("CHAOS_ERROR_RATE")

    if delay_ms > 0:
        time.sleep(delay_ms / 1000)

    if error_rate > 0 and random.random() < error_rate:
        logger.error("chaos_injected_error", error_rate=error_rate)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Injected failure (chaos)",
        )
