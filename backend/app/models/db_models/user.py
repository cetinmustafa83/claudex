import uuid
from datetime import datetime
from uuid import UUID

from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from sqlalchemy import Boolean, DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.models.types import (
    CustomAgentDict,
    CustomEnvVarDict,
    CustomMcpDict,
    CustomPromptDict,
    CustomProviderDict,
    CustomSkillDict,
    CustomSlashCommandDict,
    InstalledPluginDict,
)

from app.db.base_class import Base, PG_GEN_UUID
from app.db.types import GUID, EncryptedJSON, EncryptedString


class User(SQLAlchemyBaseUserTableUUID, Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(
        GUID(),
        primary_key=True,
        default=uuid.uuid4,
        server_default=PG_GEN_UUID,
    )
    email: Mapped[str] = mapped_column(String(length=320), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(length=256), nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true", nullable=False
    )
    is_superuser: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false", nullable=False
    )
    is_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false", nullable=False
    )

    username: Mapped[str] = mapped_column(
        String(length=64), unique=True, nullable=False
    )
    verification_token: Mapped[str | None] = mapped_column(
        String(length=128), nullable=True
    )
    verification_token_expires: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    reset_token: Mapped[str | None] = mapped_column(String(length=128), nullable=True)
    reset_token_expires: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Profile fields
    first_name: Mapped[str | None] = mapped_column(String(length=64), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(length=64), nullable=True)
    display_name: Mapped[str | None] = mapped_column(String(length=128), nullable=True)
    company_name: Mapped[str | None] = mapped_column(String(length=128), nullable=True)
    job_title: Mapped[str | None] = mapped_column(String(length=128), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(length=32), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(length=512), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    locale: Mapped[str] = mapped_column(
        String(8), default="en", server_default="en", nullable=False
    )

    chats = relationship("Chat", back_populates="user", cascade="all, delete-orphan")
    settings = relationship(
        "UserSettings",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )


class UserSettings(Base):
    __tablename__ = "user_settings"

    id: Mapped[UUID] = mapped_column(
        GUID(),
        primary_key=True,
        default=uuid.uuid4,
        server_default=PG_GEN_UUID,
    )
    user_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    github_personal_access_token: Mapped[str | None] = mapped_column(
        EncryptedString, nullable=True
    )
    sandbox_provider: Mapped[str] = mapped_column(
        String(32), default="docker", server_default="docker", nullable=False
    )
    timezone: Mapped[str] = mapped_column(
        String(64), default="UTC", server_default="UTC", nullable=False
    )
    custom_instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    custom_providers: Mapped[list[CustomProviderDict] | None] = mapped_column(
        EncryptedJSON, nullable=True
    )
    custom_agents: Mapped[list[CustomAgentDict] | None] = mapped_column(
        JSON, nullable=True
    )
    custom_mcps: Mapped[list[CustomMcpDict] | None] = mapped_column(JSON, nullable=True)
    custom_env_vars: Mapped[list[CustomEnvVarDict] | None] = mapped_column(
        JSON, nullable=True
    )
    custom_skills: Mapped[list[CustomSkillDict] | None] = mapped_column(
        JSON, nullable=True
    )
    custom_slash_commands: Mapped[list[CustomSlashCommandDict] | None] = mapped_column(
        JSON, nullable=True
    )
    custom_prompts: Mapped[list[CustomPromptDict] | None] = mapped_column(
        JSON, nullable=True
    )
    notifications_enabled: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true", nullable=False
    )
    auto_compact_disabled: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false", nullable=False
    )
    attribution_disabled: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false", nullable=False
    )
    installed_plugins: Mapped[list[InstalledPluginDict] | None] = mapped_column(
        JSON, nullable=True
    )
    gmail_oauth_client: Mapped[dict | None] = mapped_column(
        EncryptedJSON, nullable=True
    )
    gmail_oauth_tokens: Mapped[dict | None] = mapped_column(
        EncryptedJSON, nullable=True
    )
    gmail_connected_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    gmail_email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    pin_enabled: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false", nullable=False
    )
    hashed_pin: Mapped[str | None] = mapped_column(String(length=128), nullable=True)
    passwordless_enabled: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false", nullable=False
    )
    # Enterprise mode (system-wide setting, stored in first user's settings)
    enterprise_mode: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false", nullable=False
    )
    # Supabase integration
    supabase_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    supabase_anon_key: Mapped[str | None] = mapped_column(EncryptedString, nullable=True)
    supabase_service_role_key: Mapped[str | None] = mapped_column(
        EncryptedString, nullable=True
    )
    supabase_connected_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # Appwrite integration
    appwrite_endpoint: Mapped[str | None] = mapped_column(String(512), nullable=True)
    appwrite_project_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    appwrite_api_key: Mapped[str | None] = mapped_column(EncryptedString, nullable=True)
    appwrite_connected_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    user = relationship("User", back_populates="settings")


class OTPCode(Base):
    __tablename__ = "otp_codes"

    id: Mapped[UUID] = mapped_column(
        GUID(),
        primary_key=True,
        default=uuid.uuid4,
        server_default=PG_GEN_UUID,
    )
    user_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    code: Mapped[str] = mapped_column(String(length=32), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false", nullable=False
    )
