from pydantic import BaseModel


class SecretResponse(BaseModel):
    key: str
    value: str


class SecretsListResponse(BaseModel):
    secrets: list[SecretResponse]


class MessageResponse(BaseModel):
    message: str
