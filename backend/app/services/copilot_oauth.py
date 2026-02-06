import logging
from typing import Any, cast

import httpx

from app.constants import REDIS_KEY_COPILOT_DEVICE_CODE
from app.core.config import get_settings
from app.utils.redis import redis_connection

logger = logging.getLogger(__name__)

settings = get_settings()

DEVICE_CODE_URL = "https://github.com/login/device/code"
ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token"


async def request_device_code() -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            DEVICE_CODE_URL,
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "scope": "read:user",
            },
            headers={"Accept": "application/json"},
        )
        if response.status_code != 200:
            raise RuntimeError(f"Device code request failed: {response.text}")
        return cast(dict[str, Any], response.json())


async def poll_for_tokens(device_code: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            ACCESS_TOKEN_URL,
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "device_code": device_code,
                "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
            },
            headers={"Accept": "application/json"},
        )

    data = response.json()

    if data.get("access_token"):
        return {"status": "success", "access_token": data["access_token"]}

    error = data.get("error", "unknown_error")
    if error == "authorization_pending":
        return {"status": "pending"}
    if error == "slow_down":
        return {
            "status": "slow_down",
            "retry_after_seconds": int(data.get("interval", 10)),
        }
    if error == "expired_token":
        return {"status": "expired"}
    return {"status": "error", "detail": data.get("error_description", error)}


async def store_device_code(user_id: str, device_code: str, expires_in: int) -> None:
    key = REDIS_KEY_COPILOT_DEVICE_CODE.format(user_id=user_id)
    async with redis_connection() as redis:
        await redis.setex(key, expires_in, device_code)


async def get_device_code(user_id: str) -> str | None:
    key = REDIS_KEY_COPILOT_DEVICE_CODE.format(user_id=user_id)
    async with redis_connection() as redis:
        value = await redis.get(key)
    if not value:
        return None
    return cast(str, value)


async def clear_device_code(user_id: str) -> None:
    key = REDIS_KEY_COPILOT_DEVICE_CODE.format(user_id=user_id)
    async with redis_connection() as redis:
        await redis.delete(key)
