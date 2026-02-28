from typing import cast
from datetime import datetime, timedelta, timezone
import secrets
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_users import exceptions as fastapi_users_exceptions
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select, and_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.deps import get_refresh_token_service
from app.core.security import verify_password, get_password_hash
from app.core.user_manager import (
    UserDatabase,
    UserManager,
    current_active_user,
    fastapi_users,
    get_jwt_strategy,
    get_user_db,
    get_user_manager,
)
from app.db.session import get_db
from app.models.db_models.user import User, UserSettings, OTPCode
from app.models.schemas.auth import (
    LogoutRequest,
    RefreshTokenRequest,
    Token,
    UserCreate,
    UserOut,
    UserRead,
    PINSetupRequest,
    PINLoginRequest,
    PasswordlessLoginRequest,
    PasswordlessVerifyRequest,
    AuthSettingsResponse,
    AuthSettingsUpdate,
    AdminUserOut,
    AdminUserCreate,
    AdminUserUpdate,
    UserProfile,
    UserProfileUpdate,
)
from app.services.email import email_service
from app.services.exceptions import AuthException
from app.services.refresh_token import RefreshTokenService

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/jwt/login", response_model=Token)
@limiter.limit("5/minute")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    user_db: UserDatabase = Depends(get_user_db),
    db: AsyncSession = Depends(get_db),
    refresh_token_service: RefreshTokenService = Depends(get_refresh_token_service),
) -> Token:
    user = await user_db.get_by_email(form_data.username)

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is inactive",
        )

    if settings.REQUIRE_EMAIL_VERIFICATION and not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please verify your email before logging in",
        )

    strategy = get_jwt_strategy()
    access_token = await strategy.write_token(user)

    user_agent = request.headers.get("user-agent")
    client_ip = request.client.host if request.client else None
    refresh_token = await refresh_token_service.create_refresh_token(
        user_id=user.id,
        db=db,
        user_agent=user_agent,
        ip_address=client_ip,
    )

    return Token(
        access_token=access_token, refresh_token=refresh_token, token_type="bearer"
    )


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
async def register(
    request: Request,
    user_create: UserCreate,
    user_manager: UserManager = Depends(get_user_manager),
    db: AsyncSession = Depends(get_db),
) -> User:
    if settings.REGISTRATION_DISABLED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registration is disabled",
        )

    if settings.BLOCK_DISPOSABLE_EMAILS:
        if await email_service.is_disposable_email(user_create.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Disposable email addresses are not allowed. Please use a permanent email address.",
            )

    try:
        user = await user_manager.create(user_create)
    except fastapi_users_exceptions.UserAlreadyExists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    except IntegrityError as e:
        error_info = str(e.orig).lower()
        if "username" in error_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered",
            )
        elif "email" in error_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed due to a constraint violation",
            )

    # Check if enterprise mode is enabled and assign customer role
    from app.models.db_models.rbac import Role, UserRole
    settings_result = await db.execute(
        select(UserSettings).order_by(UserSettings.created_at).limit(1)
    )
    first_settings = settings_result.scalar_one_or_none()

    if first_settings and first_settings.enterprise_mode:
        # Get the customer role
        role_result = await db.execute(
            select(Role).filter(Role.name == "customer")
        )
        customer_role = role_result.scalar_one_or_none()

        if customer_role and user:
            # Assign customer role to the new user
            user_role = UserRole(
                user_id=user.id,
                role_id=customer_role.id,
            )
            db.add(user_role)
            await db.commit()
            logger.info(f"Assigned customer role to new user {user.id} (enterprise mode)")

    return cast(User, user)


router.include_router(
    fastapi_users.get_reset_password_router(),
)
router.include_router(
    fastapi_users.get_verify_router(UserRead),
)


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(current_active_user)) -> User:
    return current_user


@router.post("/jwt/refresh", response_model=Token)
@limiter.limit("10/minute")
async def refresh_access_token(
    request: Request,
    refresh_request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
    refresh_token_service: RefreshTokenService = Depends(get_refresh_token_service),
) -> Token:
    user_agent = request.headers.get("user-agent")
    client_ip = request.client.host if request.client else None

    try:
        user, new_refresh_token = await refresh_token_service.validate_and_rotate(
            token=refresh_request.refresh_token,
            db=db,
            user_agent=user_agent,
            ip_address=client_ip,
        )
    except AuthException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    strategy = get_jwt_strategy()
    access_token = await strategy.write_token(user)

    return Token(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
    )


@router.post("/jwt/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    logout_request: LogoutRequest,
    db: AsyncSession = Depends(get_db),
    refresh_token_service: RefreshTokenService = Depends(get_refresh_token_service),
) -> None:
    await refresh_token_service.revoke_token(logout_request.refresh_token, db)


@router.post("/pin/setup", response_model=AuthSettingsResponse)
async def setup_pin(
    pin_request: PINSetupRequest,
    current_user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
) -> AuthSettingsResponse:
    result = await db.execute(
        select(UserSettings).filter(UserSettings.user_id == current_user.id)
    )
    user_settings = result.scalar_one_or_none()
    if not user_settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User settings not found",
        )

    user_settings.hashed_pin = get_password_hash(pin_request.pin)
    user_settings.pin_enabled = True
    await db.commit()

    return AuthSettingsResponse(
        pin_enabled=user_settings.pin_enabled,
        passwordless_enabled=user_settings.passwordless_enabled,
    )


@router.post("/pin/login", response_model=Token)
@limiter.limit("5/minute")
async def pin_login(
    request: Request,
    pin_request: PINLoginRequest,
    user_db: UserDatabase = Depends(get_user_db),
    db: AsyncSession = Depends(get_db),
    refresh_token_service: RefreshTokenService = Depends(get_refresh_token_service),
) -> Token:
    user = await user_db.get_by_email(pin_request.email)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or PIN",
        )

    result = await db.execute(
        select(UserSettings).filter(UserSettings.user_id == user.id)
    )
    user_settings = result.scalar_one_or_none()

    if (
        not user_settings
        or not user_settings.pin_enabled
        or not user_settings.hashed_pin
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PIN login is not enabled",
        )

    if not verify_password(pin_request.pin, user_settings.hashed_pin):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or PIN",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is inactive",
        )

    if settings.REQUIRE_EMAIL_VERIFICATION and not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please verify your email before logging in",
        )

    strategy = get_jwt_strategy()
    access_token = await strategy.write_token(user)

    user_agent = request.headers.get("user-agent")
    client_ip = request.client.host if request.client else None
    refresh_token = await refresh_token_service.create_refresh_token(
        user_id=user.id,
        db=db,
        user_agent=user_agent,
        ip_address=client_ip,
    )

    return Token(
        access_token=access_token, refresh_token=refresh_token, token_type="bearer"
    )


@router.post("/passwordless/request", status_code=status.HTTP_200_OK)
@limiter.limit("3/minute")
async def request_passwordless_login(
    request: Request,
    pwless_request: PasswordlessLoginRequest,
    user_db: UserDatabase = Depends(get_user_db),
    db: AsyncSession = Depends(get_db),
) -> dict:
    user = await user_db.get_by_email(pwless_request.email)

    if not user:
        return {"message": "If the email exists, a code has been sent"}

    result = await db.execute(
        select(UserSettings).filter(UserSettings.user_id == user.id)
    )
    user_settings = result.scalar_one_or_none()

    if not user_settings or not user_settings.passwordless_enabled:
        return {"message": "If the email exists, a code has been sent"}

    code = "".join(secrets.choice("0123456789") for _ in range(6))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    otp = OTPCode(
        user_id=user.id,
        code=code,
        expires_at=expires_at,
    )
    db.add(otp)
    await db.commit()

    await email_service.send_otp_email(user.email, code)

    return {"message": "If the email exists, a code has been sent"}


@router.post("/passwordless/verify", response_model=Token)
@limiter.limit("5/minute")
async def verify_passwordless_login(
    request: Request,
    verify_request: PasswordlessVerifyRequest,
    user_db: UserDatabase = Depends(get_user_db),
    db: AsyncSession = Depends(get_db),
    refresh_token_service: RefreshTokenService = Depends(get_refresh_token_service),
) -> Token:
    user = await user_db.get_by_email(verify_request.email)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or code",
        )

    result = await db.execute(
        select(OTPCode).filter(
            and_(
                OTPCode.user_id == user.id,
                OTPCode.code == verify_request.code,
                OTPCode.used == False,
                OTPCode.expires_at > datetime.now(timezone.utc),
            )
        )
    )
    otp = result.scalar_one_or_none()

    if not otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired code",
        )

    otp.used = True
    await db.commit()

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is inactive",
        )

    if settings.REQUIRE_EMAIL_VERIFICATION and not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please verify your email before logging in",
        )

    strategy = get_jwt_strategy()
    access_token = await strategy.write_token(user)

    user_agent = request.headers.get("user-agent")
    client_ip = request.client.host if request.client else None
    refresh_token = await refresh_token_service.create_refresh_token(
        user_id=user.id,
        db=db,
        user_agent=user_agent,
        ip_address=client_ip,
    )

    return Token(
        access_token=access_token, refresh_token=refresh_token, token_type="bearer"
    )


@router.get("/settings", response_model=AuthSettingsResponse)
async def get_auth_settings(
    current_user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
) -> AuthSettingsResponse:
    result = await db.execute(
        select(UserSettings).filter(UserSettings.user_id == current_user.id)
    )
    user_settings = result.scalar_one_or_none()
    if not user_settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User settings not found",
        )

    return AuthSettingsResponse(
        pin_enabled=user_settings.pin_enabled,
        passwordless_enabled=user_settings.passwordless_enabled,
    )


@router.patch("/settings", response_model=AuthSettingsResponse)
async def update_auth_settings(
    settings_update: AuthSettingsUpdate,
    current_user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
) -> AuthSettingsResponse:
    result = await db.execute(
        select(UserSettings).filter(UserSettings.user_id == current_user.id)
    )
    user_settings = result.scalar_one_or_none()
    if not user_settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User settings not found",
        )

    if settings_update.pin_enabled is not None:
        if settings_update.pin_enabled and not user_settings.hashed_pin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please set up a PIN first",
            )
        user_settings.pin_enabled = settings_update.pin_enabled

    if settings_update.passwordless_enabled is not None:
        user_settings.passwordless_enabled = settings_update.passwordless_enabled

    await db.commit()

    return AuthSettingsResponse(
        pin_enabled=user_settings.pin_enabled,
        passwordless_enabled=user_settings.passwordless_enabled,
    )


@router.delete("/pin", status_code=status.HTTP_204_NO_CONTENT)
async def disable_pin(
    current_user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(
        select(UserSettings).filter(UserSettings.user_id == current_user.id)
    )
    user_settings = result.scalar_one_or_none()
    if user_settings:
        user_settings.pin_enabled = False
        user_settings.hashed_pin = None
        await db.commit()


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    current_user.hashed_password = get_password_hash(request.new_password)
    await db.commit()
    return {"message": "Password changed successfully"}


def require_admin(current_user: User = Depends(current_active_user)) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


@router.get("/admin/users", response_model=list[AdminUserOut])
async def list_users(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> list[AdminUserOut]:
    result = await db.execute(select(User))
    users = result.scalars().all()
    return [
        AdminUserOut(
            id=u.id,
            email=u.email,
            username=u.username,
            is_active=u.is_active,
            is_verified=u.is_verified,
            is_superuser=u.is_superuser,
        )
        for u in users
    ]


@router.post("/admin/users", response_model=AdminUserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_create: AdminUserCreate,
    admin: User = Depends(require_admin),
    user_manager: UserManager = Depends(get_user_manager),
) -> AdminUserOut:
    try:
        user = await user_manager.create(
            UserCreate(
                email=user_create.email,
                username=user_create.username,
                password=user_create.password,
            )
        )
        if user_create.is_superuser:
            user.is_superuser = True
            await user_manager.user_db.session.commit()
    except fastapi_users_exceptions.UserAlreadyExists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    except IntegrityError as e:
        error_info = str(e.orig).lower()
        if "username" in error_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create user",
        )
    return AdminUserOut(
        id=user.id,
        email=user.email,
        username=user.username,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_superuser=user.is_superuser,
    )


@router.patch("/admin/users/{user_id}", response_model=AdminUserOut)
async def update_user(
    user_id: str,
    user_update: AdminUserUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminUserOut:
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user_update.email is not None:
        user.email = user_update.email
    if user_update.username is not None:
        user.username = user_update.username
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
    if user_update.is_superuser is not None:
        user.is_superuser = user_update.is_superuser

    await db.commit()
    return AdminUserOut(
        id=user.id,
        email=user.email,
        username=user.username,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_superuser=user.is_superuser,
    )


@router.delete("/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    if user_id == str(admin.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself",
        )

    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    await db.delete(user)
    await db.commit()


@router.get("/profile", response_model=UserProfile)
async def get_profile(
    current_user: User = Depends(current_active_user),
) -> UserProfile:
    return UserProfile.model_validate(current_user)


@router.patch("/profile", response_model=UserProfile)
async def update_profile(
    profile_update: UserProfileUpdate,
    current_user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
) -> UserProfile:
    update_data = profile_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)
    return UserProfile.model_validate(current_user)
