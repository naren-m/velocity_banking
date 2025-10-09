"""Mortgage controller for API endpoints."""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.base import get_db
from ..models.schemas import (
    MortgageCreate,
    MortgageUpdate,
    MortgageResponse,
    AmortizationSchedule,
)
from ..services.mortgage_service import MortgageService
from ..services.calculation_service import CalculationService

router = APIRouter(prefix="/mortgages", tags=["mortgages"])
mortgage_service = MortgageService()
calculation_service = CalculationService()


@router.post("/", response_model=MortgageResponse, status_code=status.HTTP_201_CREATED)
async def create_mortgage(
    data: MortgageCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MortgageResponse:
    """Create a new mortgage."""
    mortgage = await mortgage_service.create_mortgage(db, data)
    return MortgageResponse.model_validate(mortgage)


@router.get("/{mortgage_id}", response_model=MortgageResponse)
async def get_mortgage(
    mortgage_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MortgageResponse:
    """Get a mortgage by ID."""
    mortgage = await mortgage_service.get_mortgage(db, mortgage_id)
    if not mortgage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Mortgage not found"
        )
    return MortgageResponse.model_validate(mortgage)


@router.get("/user/{user_id}", response_model=list[MortgageResponse])
async def get_mortgages_by_user(
    user_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[MortgageResponse]:
    """Get all mortgages for a user."""
    mortgages = await mortgage_service.get_mortgages_by_user(db, user_id)
    return [MortgageResponse.model_validate(m) for m in mortgages]


@router.patch("/{mortgage_id}", response_model=MortgageResponse)
async def update_mortgage(
    mortgage_id: str,
    data: MortgageUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MortgageResponse:
    """Update a mortgage."""
    mortgage = await mortgage_service.update_mortgage(db, mortgage_id, data)
    if not mortgage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Mortgage not found"
        )
    return MortgageResponse.model_validate(mortgage)


@router.delete("/{mortgage_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mortgage(
    mortgage_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """Delete a mortgage."""
    deleted = await mortgage_service.delete_mortgage(db, mortgage_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Mortgage not found"
        )


@router.get("/{mortgage_id}/amortization", response_model=AmortizationSchedule)
async def get_amortization(
    mortgage_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AmortizationSchedule:
    """Get amortization schedule for a mortgage."""
    mortgage = await mortgage_service.get_mortgage(db, mortgage_id)
    if not mortgage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Mortgage not found"
        )

    schedule = calculation_service.calculate_amortization(
        mortgage.current_balance,
        mortgage.interest_rate,
        mortgage.monthly_payment,
    )
    return schedule
