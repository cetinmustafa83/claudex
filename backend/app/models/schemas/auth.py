from uuid import UUID

from fastapi_users import schemas
from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    computed_field,
    field_validator,
)

from app.core.config import get_settings


class UserRead(schemas.BaseUser[UUID]):
    username: str

    @computed_field
    def email_verification_required(self) -> bool:
        return get_settings().REQUIRE_EMAIL_VERIFICATION


class UserCreate(schemas.BaseUserCreate):
    username: str
    password: str = Field(..., min_length=8)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not v:
            raise ValueError("Username is required")
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters long")
        if len(v) > 30:
            raise ValueError("Username must be less than 30 characters long")
        if not v.replace("_", "").isalnum():
            raise ValueError(
                "Username can only contain letters, numbers, and underscores"
            )
        if v.startswith("_") or v.endswith("_"):
            raise ValueError("Username cannot start or end with underscore")
        return v


class UserBase(BaseModel):
    email: EmailStr
    username: str


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    is_verified: bool
    is_superuser: bool = False


class AdminUserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    is_active: bool
    is_verified: bool
    is_superuser: bool
    created_at: str | None = None


class AdminUserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str = Field(..., min_length=8)
    is_superuser: bool = False


class AdminUserUpdate(BaseModel):
    email: EmailStr | None = None
    username: str | None = None
    is_active: bool | None = None
    is_superuser: bool | None = None


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class TokenData(BaseModel):
    email: str | None = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class PINSetupRequest(BaseModel):
    pin: str = Field(..., min_length=4, max_length=6, pattern=r"^\d+$")


class PINLoginRequest(BaseModel):
    email: EmailStr
    pin: str = Field(..., min_length=4, max_length=6, pattern=r"^\d+$")


class PasswordlessLoginRequest(BaseModel):
    email: EmailStr


class PasswordlessVerifyRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d+$")


class AuthSettingsResponse(BaseModel):
    pin_enabled: bool
    passwordless_enabled: bool


class AuthSettingsUpdate(BaseModel):
    pin_enabled: bool | None = None
    passwordless_enabled: bool | None = None


class UserProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    username: str
    first_name: str | None = None
    last_name: str | None = None
    display_name: str | None = None
    company_name: str | None = None
    job_title: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    bio: str | None = None
    locale: str = "en"
    is_verified: bool
    is_superuser: bool = False


class UserProfileUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    display_name: str | None = None
    company_name: str | None = None
    job_title: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    bio: str | None = None
    locale: str | None = None

    @field_validator("first_name", "last_name", "display_name", "company_name", "job_title")
    @classmethod
    def validate_name_fields(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if len(v) > 64:
                raise ValueError("Field must be less than 64 characters")
        return v

    @field_validator("bio")
    @classmethod
    def validate_bio(cls, v: str | None) -> str | None:
        if v is not None and len(v) > 500:
            raise ValueError("Bio must be less than 500 characters")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if len(v) > 32:
                raise ValueError("Phone must be less than 32 characters")
        return v
