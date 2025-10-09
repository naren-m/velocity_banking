"""Unit tests for mortgage service."""
from datetime import datetime
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.schemas import MortgageCreate, MortgageUpdate
from ..models.user import User
from ..services.mortgage_service import MortgageService


class TestMortgageService:
    """Test mortgage service methods."""

    @pytest.fixture
    def service(self):
        """Create mortgage service instance."""
        return MortgageService()

    @pytest.fixture
    async def test_user(self, test_db: AsyncSession) -> User:
        """Create a test user."""
        user = User(
            id="test-user-123",
            email="test@example.com",
            name="Test User",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        return user

    @pytest.mark.asyncio
    async def test_create_mortgage(
        self, service: MortgageService, test_db: AsyncSession, test_user: User
    ):
        """Test creating a mortgage."""
        data = MortgageCreate(
            user_id=test_user.id,
            principal=300000.0,
            current_balance=280000.0,
            interest_rate=5.5,
            monthly_payment=1500.0,
            start_date=datetime(2023, 1, 1),
            term_months=360,
            monthly_income=7000.0,
            monthly_expenses=4500.0,
        )

        mortgage = await service.create_mortgage(test_db, data)

        assert mortgage.id is not None
        assert mortgage.user_id == test_user.id
        assert mortgage.principal == 300000.0
        assert mortgage.current_balance == 280000.0

    @pytest.mark.asyncio
    async def test_get_mortgage(
        self, service: MortgageService, test_db: AsyncSession, test_user: User
    ):
        """Test retrieving a mortgage by ID."""
        data = MortgageCreate(
            user_id=test_user.id,
            principal=250000.0,
            current_balance=245000.0,
            interest_rate=4.5,
            monthly_payment=1200.0,
            start_date=datetime(2023, 6, 1),
            term_months=360,
        )

        created = await service.create_mortgage(test_db, data)
        retrieved = await service.get_mortgage(test_db, created.id)

        assert retrieved is not None
        assert retrieved.id == created.id
        assert retrieved.principal == 250000.0

    @pytest.mark.asyncio
    async def test_get_mortgage_not_found(self, service: MortgageService, test_db: AsyncSession):
        """Test retrieving non-existent mortgage."""
        mortgage = await service.get_mortgage(test_db, "non-existent-id")
        assert mortgage is None

    @pytest.mark.asyncio
    async def test_get_mortgages_by_user(
        self, service: MortgageService, test_db: AsyncSession, test_user: User
    ):
        """Test retrieving all mortgages for a user."""
        # Create multiple mortgages
        for i in range(3):
            data = MortgageCreate(
                user_id=test_user.id,
                principal=200000.0 + i * 10000,
                current_balance=190000.0 + i * 10000,
                interest_rate=5.0 + i * 0.5,
                monthly_payment=1300.0,
                start_date=datetime(2023, 1, 1),
                term_months=360,
            )
            await service.create_mortgage(test_db, data)

        mortgages = await service.get_mortgages_by_user(test_db, test_user.id)

        assert len(mortgages) == 3
        assert all(m.user_id == test_user.id for m in mortgages)

    @pytest.mark.asyncio
    async def test_update_mortgage(
        self, service: MortgageService, test_db: AsyncSession, test_user: User
    ):
        """Test updating a mortgage."""
        data = MortgageCreate(
            user_id=test_user.id,
            principal=300000.0,
            current_balance=280000.0,
            interest_rate=5.5,
            monthly_payment=1500.0,
            start_date=datetime(2023, 1, 1),
            term_months=360,
        )

        created = await service.create_mortgage(test_db, data)

        update_data = MortgageUpdate(
            current_balance=275000.0,
            monthly_payment=1600.0,
        )

        updated = await service.update_mortgage(test_db, created.id, update_data)

        assert updated is not None
        assert updated.current_balance == 275000.0
        assert updated.monthly_payment == 1600.0
        assert updated.interest_rate == 5.5  # Unchanged

    @pytest.mark.asyncio
    async def test_update_mortgage_not_found(
        self, service: MortgageService, test_db: AsyncSession
    ):
        """Test updating non-existent mortgage."""
        update_data = MortgageUpdate(current_balance=250000.0)
        result = await service.update_mortgage(test_db, "non-existent-id", update_data)
        assert result is None

    @pytest.mark.asyncio
    async def test_delete_mortgage(
        self, service: MortgageService, test_db: AsyncSession, test_user: User
    ):
        """Test deleting a mortgage."""
        data = MortgageCreate(
            user_id=test_user.id,
            principal=200000.0,
            current_balance=195000.0,
            interest_rate=4.75,
            monthly_payment=1100.0,
            start_date=datetime(2023, 1, 1),
            term_months=360,
        )

        created = await service.create_mortgage(test_db, data)
        deleted = await service.delete_mortgage(test_db, created.id)

        assert deleted is True

        # Verify it's gone
        retrieved = await service.get_mortgage(test_db, created.id)
        assert retrieved is None

    @pytest.mark.asyncio
    async def test_delete_mortgage_not_found(
        self, service: MortgageService, test_db: AsyncSession
    ):
        """Test deleting non-existent mortgage."""
        result = await service.delete_mortgage(test_db, "non-existent-id")
        assert result is False
