from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.engine import make_url

from app.core.config import get_settings

settings = get_settings()

_is_sqlite = make_url(settings.DATABASE_URL).get_backend_name() == "sqlite"

if _is_sqlite:
    engine = create_async_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False,
    )
else:
    engine = create_async_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=30,
        max_overflow=20,
        pool_recycle=3600,
        pool_timeout=120,
        echo=False,
    )

SessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


async def get_db() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as db:
        yield db
