from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class OAuthClientUploadRequest(BaseModel):
    client_config: dict[str, Any] = Field(
        ..., description="Contents of gcp-oauth.keys.json"
    )


class OAuthClientResponse(BaseModel):
    success: bool
    message: str


class OAuthUrlResponse(BaseModel):
    url: str


class GmailStatusResponse(BaseModel):
    connected: bool
    email: str | None = None
    connected_at: datetime | None = None
    has_oauth_client: bool = False


class DeviceCodeResponse(BaseModel):
    verification_uri: str
    user_code: str
    device_code: str
    interval: int
    expires_in: int


class PollTokenRequest(BaseModel):
    device_code: str


class OpenAIPollTokenRequest(BaseModel):
    device_code: str
    user_code: str


class PollTokenResponse(BaseModel):
    status: str
    access_token: str | None = None
    refresh_token: str | None = None
    interval: int | None = None


# Supabase schemas
class SupabaseConfigRequest(BaseModel):
    url: str = Field(..., description="Supabase project URL (cloud or self-hosted)")
    anon_key: str = Field(..., description="Supabase anonymous/public key")
    service_role_key: str | None = Field(None, description="Supabase service role key (optional)")


class SupabaseStatusResponse(BaseModel):
    connected: bool
    url: str | None = None
    project_name: str | None = None
    connected_at: datetime | None = None


# Appwrite schemas
class AppwriteConfigRequest(BaseModel):
    endpoint: str = Field(
        ..., description="Appwrite endpoint URL (cloud.appwrite.io or self-hosted)"
    )
    project_id: str = Field(..., description="Appwrite project ID")
    api_key: str = Field(..., description="Appwrite API key")


class AppwriteStatusResponse(BaseModel):
    connected: bool
    endpoint: str | None = None
    project_id: str | None = None
    project_name: str | None = None
    connected_at: datetime | None = None
