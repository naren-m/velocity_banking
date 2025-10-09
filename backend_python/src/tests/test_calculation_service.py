"""Unit tests for calculation service."""
import pytest
from ..services.calculation_service import CalculationService


class TestCalculationService:
    """Test calculation service methods."""

    @pytest.fixture
    def service(self):
        """Create calculation service instance."""
        return CalculationService()

    def test_calculate_monthly_payment_standard(self, service: CalculationService):
        """Test monthly payment calculation with standard values."""
        # 300k loan, 5% interest, 30 years
        payment = service.calculate_monthly_payment(300000, 5.0, 360)
        assert abs(payment - 1610.46) < 1.0  # Allow small rounding differences

    def test_calculate_monthly_payment_zero_interest(self, service: CalculationService):
        """Test monthly payment calculation with zero interest."""
        payment = service.calculate_monthly_payment(100000, 0.0, 120)
        assert abs(payment - 833.33) < 0.01

    def test_calculate_monthly_payment_high_rate(self, service: CalculationService):
        """Test monthly payment calculation with high interest rate."""
        payment = service.calculate_monthly_payment(200000, 10.0, 180)
        assert payment > 2000  # Should be substantial with 10% rate

    def test_calculate_amortization_completes(self, service: CalculationService):
        """Test amortization schedule completes correctly."""
        schedule = service.calculate_amortization(100000, 5.0, 1000)

        assert len(schedule.schedule) > 0
        assert schedule.months_to_payoff > 0
        assert schedule.total_interest > 0
        assert schedule.schedule[-1].balance < 1.0  # Final balance near zero

    def test_calculate_amortization_interest_decreases(self, service: CalculationService):
        """Test that interest portion decreases over time."""
        schedule = service.calculate_amortization(100000, 5.0, 1000)

        first_interest = schedule.schedule[0].interest
        last_interest = schedule.schedule[-1].interest

        assert first_interest > last_interest

    def test_calculate_amortization_principal_increases(self, service: CalculationService):
        """Test that principal portion increases over time."""
        schedule = service.calculate_amortization(100000, 5.0, 1000)

        first_principal = schedule.schedule[0].principal
        last_principal = schedule.schedule[-1].principal

        assert first_principal < last_principal

    def test_calculate_velocity_scenario_reduces_payoff_time(self, service: CalculationService):
        """Test velocity scenario reduces payoff time."""
        # Standard scenario
        standard = service.calculate_amortization(200000, 5.0, 1500)

        # Velocity scenario with monthly $5000 chunks
        velocity = service.calculate_velocity_scenario(200000, 5.0, 1500, 5000, "monthly")

        assert velocity["total_months"] < standard.months_to_payoff
        assert velocity["total_interest"] < standard.total_interest

    def test_calculate_velocity_scenario_chunk_frequencies(self, service: CalculationService):
        """Test different chunk payment frequencies."""
        base_params = (100000, 5.0, 1000, 2000)

        monthly = service.calculate_velocity_scenario(*base_params, "monthly")
        quarterly = service.calculate_velocity_scenario(*base_params, "quarterly")
        annual = service.calculate_velocity_scenario(*base_params, "annual")

        # Monthly chunks should pay off fastest
        assert monthly["total_months"] < quarterly["total_months"]
        assert quarterly["total_months"] < annual["total_months"]

    def test_calculate_optimal_chunk_conservative(self, service: CalculationService):
        """Test optimal chunk calculation is conservative."""
        result = service.calculate_optimal_chunk(
            current_balance=200000,
            interest_rate=5.0,
            monthly_payment=1500,
            available_loc=50000,
            monthly_income=8000,
            monthly_expenses=5000,
        )

        # Should recommend less than full LOC
        assert result["recommended_chunk"] < 50000

        # Should be repayable in 3 months
        monthly_cashflow = 8000 - 5000
        assert result["recommended_chunk"] <= monthly_cashflow * 3

    def test_calculate_optimal_chunk_scenarios(self, service: CalculationService):
        """Test optimal chunk provides multiple scenarios."""
        result = service.calculate_optimal_chunk(
            current_balance=200000,
            interest_rate=5.0,
            monthly_payment=1500,
            available_loc=30000,
            monthly_income=7000,
            monthly_expenses=4500,
        )

        assert len(result["scenarios"]) == 3
        assert all("chunk_amount" in s for s in result["scenarios"])
        assert all("months_to_payoff" in s for s in result["scenarios"])

    def test_calculate_savings_accurate(self, service: CalculationService):
        """Test savings calculation is accurate."""
        standard = service.calculate_amortization(150000, 5.0, 1200)
        velocity = service.calculate_velocity_scenario(150000, 5.0, 1200, 3000, "monthly")

        savings = service.calculate_savings(standard, velocity)

        assert savings["interest_saved"] > 0
        assert savings["months_saved"] > 0
        assert 0 < savings["percentage_saved"] < 100

    def test_calculate_savings_zero_chunk(self, service: CalculationService):
        """Test savings with zero chunk payment."""
        standard = service.calculate_amortization(100000, 5.0, 1000)
        velocity = service.calculate_velocity_scenario(100000, 5.0, 1000, 0, "monthly")

        savings = service.calculate_savings(standard, velocity)

        # Should be minimal savings with no chunks
        assert abs(savings["interest_saved"]) < 100
        assert abs(savings["months_saved"]) < 2
