from typing import Any, cast

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_user_service
from app.core.security import get_current_user
from app.models.db_models.user import User
from app.models.schemas.settings import UserSettingsBase, UserSettingsResponse
from app.services.a4f_service import A4FService
from app.services.exceptions import UserException
from app.services.user import DuplicateProviderNameError, UserService
from app.utils.cache import cache_connection

router = APIRouter()


class A4FModelsRequest(BaseModel):
    api_key: str


class A4FModelsResponse(BaseModel):
    success: bool
    error: str | None = None
    models: list[dict[str, Any]] = []


@router.get("/", response_model=UserSettingsResponse)
async def get_user_settings(
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
) -> UserSettingsResponse:
    try:
        async with cache_connection() as cache:
            return await user_service.get_user_settings_response(
                current_user.id, cache=cache
            )
    except UserException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.patch("/", response_model=UserSettingsResponse)
async def update_user_settings(
    settings_update: UserSettingsBase,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
) -> UserSettingsResponse:
    update_data = settings_update.model_dump(exclude_unset=True)
    try:
        user_settings = await user_service.update_user_settings(
            user_id=current_user.id, settings_update=update_data, db=db
        )
    except DuplicateProviderNameError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except UserException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    async with cache_connection() as cache:
        await user_service.invalidate_settings_cache(cache, current_user.id)
    response = cast(
        UserSettingsResponse, UserSettingsResponse.model_validate(user_settings)
    )
    return response


@router.post("/a4f/models", response_model=A4FModelsResponse)
async def fetch_a4f_models(
    request: A4FModelsRequest,
    _current_user: User = Depends(get_current_user),
) -> A4FModelsResponse:
    """Fetch available models from A4F API."""
    success, error, models = await A4FService.fetch_models(request.api_key)
    return A4FModelsResponse(success=success, error=error, models=models)
