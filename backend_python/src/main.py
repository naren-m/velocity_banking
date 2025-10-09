"""Main FastAPI application."""
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

from .config import settings
from .models.base import init_db
from .middleware.error_handler import (
    validation_exception_handler,
    sqlalchemy_exception_handler,
    general_exception_handler,
)
from .controllers.mortgage_controller import router as mortgage_router

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Lifespan context manager for startup/shutdown events."""
    # Startup
    logger.info("Initializing database...")
    await init_db()
    logger.info("Database initialized successfully")
    yield
    # Shutdown
    logger.info("Shutting down application...")


# Create FastAPI application
app = FastAPI(
    title="Velocity Banking API",
    description="Backend API for velocity banking mortgage calculator",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register exception handlers
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Register routers
app.include_router(mortgage_router, prefix="/api")


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/")
async def root() -> dict:
    """Root endpoint."""
    return {
        "message": "Velocity Banking API",
        "version": "1.0.0",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="debug" if settings.debug else "info",
    )
