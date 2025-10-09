"""Mortgage service for database operations."""
import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.mortgage import Mortgage
from ..models.schemas import MortgageCreate, MortgageUpdate


class MortgageService:
    """Service for mortgage-related database operations."""

    async def create_mortgage(self, db: AsyncSession, data: MortgageCreate) -> Mortgage:
        """Create a new mortgage.

        Args:
            db: Database session
            data: Mortgage creation data

        Returns:
            Created mortgage instance
        """
        mortgage = Mortgage(
            id=str(uuid.uuid4()),
            user_id=data.user_id,
            principal=data.principal,
            current_balance=data.current_balance,
            interest_rate=data.interest_rate,
            monthly_payment=data.monthly_payment,
            start_date=data.start_date,
            term_months=data.term_months,
            monthly_income=data.monthly_income,
            monthly_expenses=data.monthly_expenses,
        )
        db.add(mortgage)
        await db.commit()
        await db.refresh(mortgage)
        return mortgage

    async def get_mortgage(self, db: AsyncSession, mortgage_id: str) -> Optional[Mortgage]:
        """Get a mortgage by ID.

        Args:
            db: Database session
            mortgage_id: Mortgage ID

        Returns:
            Mortgage instance or None if not found
        """
        result = await db.execute(select(Mortgage).filter_by(id=mortgage_id))
        return result.scalar_one_or_none()

    async def get_mortgages_by_user(self, db: AsyncSession, user_id: str) -> list[Mortgage]:
        """Get all mortgages for a user.

        Args:
            db: Database session
            user_id: User ID

        Returns:
            List of mortgage instances
        """
        result = await db.execute(select(Mortgage).filter_by(user_id=user_id))
        return list(result.scalars().all())

    async def update_mortgage(
        self, db: AsyncSession, mortgage_id: str, data: MortgageUpdate
    ) -> Optional[Mortgage]:
        """Update a mortgage.

        Args:
            db: Database session
            mortgage_id: Mortgage ID
            data: Update data

        Returns:
            Updated mortgage instance or None if not found
        """
        mortgage = await self.get_mortgage(db, mortgage_id)
        if not mortgage:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(mortgage, key, value)

        await db.commit()
        await db.refresh(mortgage)
        return mortgage

    async def delete_mortgage(self, db: AsyncSession, mortgage_id: str) -> bool:
        """Delete a mortgage.

        Args:
            db: Database session
            mortgage_id: Mortgage ID

        Returns:
            True if deleted, False if not found
        """
        mortgage = await self.get_mortgage(db, mortgage_id)
        if not mortgage:
            return False

        await db.delete(mortgage)
        await db.commit()
        return True
