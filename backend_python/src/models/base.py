"""Base model and database setup."""
from datetime import datetime
from typing import AsyncGenerator
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func

from config import settings


class Base(DeclarativeBase):
    """Base class for all database models."""

    pass


# Create async engine
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create demo user if it doesn't exist
    async with AsyncSessionLocal() as session:
        from .user import User
        from sqlalchemy import select

        result = await session.execute(select(User).filter_by(email="demo@example.com"))
        demo_user = result.scalar_one_or_none()

        if not demo_user:
            demo_user = User(
                id="demo-user",
                email="demo@example.com",
                name="Demo User",
            )
            session.add(demo_user)
            await session.commit()
