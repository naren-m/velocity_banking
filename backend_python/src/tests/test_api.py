"""Integration tests for API endpoints."""
from datetime import datetime
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.user import User


class TestMortgageAPI:
    """Test mortgage API endpoints."""

    @pytest.fixture
    async def test_user(self, test_db: AsyncSession) -> User:
        """Create a test user."""
        user = User(
            id="api-test-user",
            email="api@example.com",
            name="API Test User",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        return user

    @pytest.mark.asyncio
    async def test_health_check(self, client: AsyncClient):
        """Test health check endpoint."""
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    @pytest.mark.asyncio
    async def test_create_mortgage_success(self, client: AsyncClient, test_user: User):
        """Test successful mortgage creation."""
        data = {
            "user_id": test_user.id,
            "principal": 300000.0,
            "current_balance": 280000.0,
            "interest_rate": 5.5,
            "monthly_payment": 1500.0,
            "start_date": "2023-01-01T00:00:00",
            "term_months": 360,
            "monthly_income": 7000.0,
            "monthly_expenses": 4500.0,
        }

        response = await client.post("/api/mortgages/", json=data)

        assert response.status_code == 201
        result = response.json()
        assert result["user_id"] == test_user.id
        assert result["principal"] == 300000.0
        assert "id" in result

    @pytest.mark.asyncio
    async def test_create_mortgage_validation_error(self, client: AsyncClient, test_user: User):
        """Test mortgage creation with invalid data."""
        data = {
            "user_id": test_user.id,
            "principal": -100000.0,  # Invalid negative value
            "current_balance": 280000.0,
            "interest_rate": 5.5,
            "monthly_payment": 1500.0,
            "start_date": "2023-01-01T00:00:00",
            "term_months": 360,
        }

        response = await client.post("/api/mortgages/", json=data)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_get_mortgage_success(self, client: AsyncClient, test_user: User):
        """Test retrieving a mortgage."""
        # Create mortgage first
        create_data = {
            "user_id": test_user.id,
            "principal": 250000.0,
            "current_balance": 245000.0,
            "interest_rate": 4.5,
            "monthly_payment": 1200.0,
            "start_date": "2023-06-01T00:00:00",
            "term_months": 360,
        }

        create_response = await client.post("/api/mortgages/", json=create_data)
        mortgage_id = create_response.json()["id"]

        # Retrieve it
        response = await client.get(f"/api/mortgages/{mortgage_id}")

        assert response.status_code == 200
        result = response.json()
        assert result["id"] == mortgage_id
        assert result["principal"] == 250000.0

    @pytest.mark.asyncio
    async def test_get_mortgage_not_found(self, client: AsyncClient):
        """Test retrieving non-existent mortgage."""
        response = await client.get("/api/mortgages/non-existent-id")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_mortgages_by_user(self, client: AsyncClient, test_user: User):
        """Test retrieving all mortgages for a user."""
        # Create multiple mortgages
        for i in range(3):
            data = {
                "user_id": test_user.id,
                "principal": 200000.0 + i * 10000,
                "current_balance": 190000.0 + i * 10000,
                "interest_rate": 5.0,
                "monthly_payment": 1300.0,
                "start_date": "2023-01-01T00:00:00",
                "term_months": 360,
            }
            await client.post("/api/mortgages/", json=data)

        response = await client.get(f"/api/mortgages/user/{test_user.id}")

        assert response.status_code == 200
        mortgages = response.json()
        assert len(mortgages) == 3

    @pytest.mark.asyncio
    async def test_update_mortgage_success(self, client: AsyncClient, test_user: User):
        """Test updating a mortgage."""
        # Create mortgage
        create_data = {
            "user_id": test_user.id,
            "principal": 300000.0,
            "current_balance": 280000.0,
            "interest_rate": 5.5,
            "monthly_payment": 1500.0,
            "start_date": "2023-01-01T00:00:00",
            "term_months": 360,
        }

        create_response = await client.post("/api/mortgages/", json=create_data)
        mortgage_id = create_response.json()["id"]

        # Update it
        update_data = {
            "current_balance": 275000.0,
            "monthly_payment": 1600.0,
        }

        response = await client.patch(f"/api/mortgages/{mortgage_id}", json=update_data)

        assert response.status_code == 200
        result = response.json()
        assert result["current_balance"] == 275000.0
        assert result["monthly_payment"] == 1600.0

    @pytest.mark.asyncio
    async def test_delete_mortgage_success(self, client: AsyncClient, test_user: User):
        """Test deleting a mortgage."""
        # Create mortgage
        create_data = {
            "user_id": test_user.id,
            "principal": 200000.0,
            "current_balance": 195000.0,
            "interest_rate": 4.75,
            "monthly_payment": 1100.0,
            "start_date": "2023-01-01T00:00:00",
            "term_months": 360,
        }

        create_response = await client.post("/api/mortgages/", json=create_data)
        mortgage_id = create_response.json()["id"]

        # Delete it
        response = await client.delete(f"/api/mortgages/{mortgage_id}")
        assert response.status_code == 204

        # Verify it's gone
        get_response = await client.get(f"/api/mortgages/{mortgage_id}")
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_amortization_schedule(self, client: AsyncClient, test_user: User):
        """Test retrieving amortization schedule."""
        # Create mortgage
        create_data = {
            "user_id": test_user.id,
            "principal": 100000.0,
            "current_balance": 100000.0,
            "interest_rate": 5.0,
            "monthly_payment": 1000.0,
            "start_date": "2023-01-01T00:00:00",
            "term_months": 360,
        }

        create_response = await client.post("/api/mortgages/", json=create_data)
        mortgage_id = create_response.json()["id"]

        # Get amortization
        response = await client.get(f"/api/mortgages/{mortgage_id}/amortization")

        assert response.status_code == 200
        result = response.json()
        assert "schedule" in result
        assert "total_interest" in result
        assert "months_to_payoff" in result
        assert len(result["schedule"]) > 0
