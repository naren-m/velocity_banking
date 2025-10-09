"""Unit tests for optimization service."""
import pytest
import numpy as np
from ..services.optimization_service import (
    OptimizationService,
    OptimizationConstraints,
    OptimizationResult,
)


class TestOptimizationService:
    """Test optimization service methods."""

    @pytest.fixture
    def service(self):
        """Create optimization service instance."""
        return OptimizationService()

    @pytest.fixture
    def standard_constraints(self):
        """Standard optimization constraints for testing."""
        return OptimizationConstraints(
            min_chunk=1000.0,
            max_chunk=20000.0,
            available_loc=25000.0,
            monthly_income=7000.0,
            monthly_expenses=4500.0,
            min_cashflow_reserve=1000.0,
        )

    def test_calculate_payoff_time_no_chunks(self, service: OptimizationService):
        """Test payoff time calculation without chunk payments."""
        months, interest = service._calculate_payoff_time(
            chunk_amount=0, balance=100000, interest_rate=5.0, monthly_payment=1000, frequency="monthly"
        )

        assert months > 0
        assert months < 360  # Should complete within 30 years
        assert interest > 0

    def test_calculate_payoff_time_with_chunks(self, service: OptimizationService):
        """Test payoff time calculation with chunk payments."""
        # Without chunks
        months_no_chunk, interest_no_chunk = service._calculate_payoff_time(
            chunk_amount=0, balance=100000, interest_rate=5.0, monthly_payment=1000, frequency="monthly"
        )

        # With chunks
        months_with_chunk, interest_with_chunk = service._calculate_payoff_time(
            chunk_amount=5000,
            balance=100000,
            interest_rate=5.0,
            monthly_payment=1000,
            frequency="monthly",
        )

        # Chunks should reduce both time and interest
        assert months_with_chunk < months_no_chunk
        assert interest_with_chunk < interest_no_chunk

    def test_optimize_chunk_balanced_goal(
        self, service: OptimizationService, standard_constraints: OptimizationConstraints
    ):
        """Test optimization with balanced goal."""
        result = service.optimize_chunk_amount(
            balance=200000,
            interest_rate=5.5,
            monthly_payment=1500,
            constraints=standard_constraints,
            frequency="monthly",
            optimization_goal="balanced",
            method="differential_evolution",
        )

        assert isinstance(result, OptimizationResult)
        assert standard_constraints.min_chunk <= result.optimal_chunk <= standard_constraints.max_chunk
        assert result.months_to_payoff > 0
        assert result.total_interest > 0
        assert result.interest_saved > 0
        assert 0 <= result.confidence_score <= 1.0
        assert result.strategy_type in ["conservative", "moderate", "aggressive"]

    def test_optimize_chunk_interest_goal(
        self, service: OptimizationService, standard_constraints: OptimizationConstraints
    ):
        """Test optimization focused on minimizing interest."""
        result = service.optimize_chunk_amount(
            balance=200000,
            interest_rate=5.5,
            monthly_payment=1500,
            constraints=standard_constraints,
            frequency="monthly",
            optimization_goal="interest",
            method="differential_evolution",
        )

        assert isinstance(result, OptimizationResult)
        assert result.interest_saved > 0
        # Interest optimization should tend towards higher chunks
        assert result.optimal_chunk > standard_constraints.min_chunk

    def test_optimize_chunk_time_goal(
        self, service: OptimizationService, standard_constraints: OptimizationConstraints
    ):
        """Test optimization focused on minimizing payoff time."""
        result = service.optimize_chunk_amount(
            balance=200000,
            interest_rate=5.5,
            monthly_payment=1500,
            constraints=standard_constraints,
            frequency="monthly",
            optimization_goal="time",
            method="differential_evolution",
        )

        assert isinstance(result, OptimizationResult)
        assert result.months_to_payoff > 0
        # Time optimization should tend towards higher chunks
        assert result.optimal_chunk > standard_constraints.min_chunk

    def test_optimization_methods_comparison(
        self, service: OptimizationService, standard_constraints: OptimizationConstraints
    ):
        """Test that different optimization methods produce reasonable results."""
        methods = ["scipy", "differential_evolution", "grid_search"]
        results = {}

        for method in methods:
            result = service.optimize_chunk_amount(
                balance=150000,
                interest_rate=5.0,
                monthly_payment=1200,
                constraints=standard_constraints,
                frequency="monthly",
                optimization_goal="balanced",
                method=method,
            )
            results[method] = result

        # All methods should find valid solutions
        for method, result in results.items():
            assert standard_constraints.min_chunk <= result.optimal_chunk <= standard_constraints.max_chunk
            assert result.interest_saved > 0

        # Results should be relatively close
        chunks = [r.optimal_chunk for r in results.values()]
        chunk_range = max(chunks) - min(chunks)
        assert chunk_range < standard_constraints.max_chunk * 0.5  # Within 50% range

    def test_compare_optimization_methods(
        self, service: OptimizationService, standard_constraints: OptimizationConstraints
    ):
        """Test method comparison functionality."""
        results = service.compare_optimization_methods(
            balance=200000,
            interest_rate=5.5,
            monthly_payment=1500,
            constraints=standard_constraints,
            frequency="monthly",
            optimization_goal="balanced",
        )

        assert len(results) == 3
        assert "scipy" in results
        assert "differential_evolution" in results
        assert "grid_search" in results

        for method, result in results.items():
            assert isinstance(result, OptimizationResult)
            assert result.optimal_chunk > 0

    def test_multi_objective_optimization(
        self, service: OptimizationService, standard_constraints: OptimizationConstraints
    ):
        """Test multi-objective optimization (Pareto-optimal solutions)."""
        results = service.multi_objective_optimization(
            balance=200000,
            interest_rate=5.5,
            monthly_payment=1500,
            constraints=standard_constraints,
            frequency="monthly",
        )

        assert len(results) == 3  # One for each objective
        assert all(isinstance(r, OptimizationResult) for r in results)

        # Each solution should be valid
        for result in results:
            assert standard_constraints.min_chunk <= result.optimal_chunk <= standard_constraints.max_chunk
            assert result.interest_saved > 0

    def test_sensitivity_analysis(
        self, service: OptimizationService, standard_constraints: OptimizationConstraints
    ):
        """Test sensitivity analysis functionality."""
        optimal_chunk = 10000.0

        sensitivities = service.sensitivity_analysis(
            balance=200000,
            interest_rate=5.5,
            monthly_payment=1500,
            constraints=standard_constraints,
            optimal_chunk=optimal_chunk,
            frequency="monthly",
            perturbation=0.1,
        )

        assert "interest_rate" in sensitivities
        assert "chunk_amount" in sensitivities
        assert "monthly_payment" in sensitivities

        # Each sensitivity should have required metrics
        for param, metrics in sensitivities.items():
            assert "months_change" in metrics
            assert "interest_change" in metrics
            assert "months_pct" in metrics
            assert "interest_pct" in metrics

    def test_confidence_score_calculation(
        self, service: OptimizationService, standard_constraints: OptimizationConstraints
    ):
        """Test confidence score calculation."""
        # Test successful convergence
        score1 = service._calculate_confidence_score(
            optimal_chunk=10000.0, constraints=standard_constraints, convergence_success=True
        )
        assert 0 <= score1 <= 1.0
        assert score1 > 0.5  # Should be high for middle-range solution

        # Test failed convergence
        score2 = service._calculate_confidence_score(
            optimal_chunk=10000.0, constraints=standard_constraints, convergence_success=False
        )
        assert score2 < score1  # Failed convergence should have lower score
        assert score2 == 0.3  # Default low score for failed convergence

        # Test extreme solution (at boundary)
        score3 = service._calculate_confidence_score(
            optimal_chunk=standard_constraints.max_chunk,
            constraints=standard_constraints,
            convergence_success=True,
        )
        assert score3 < score1  # Extreme solution should have lower confidence

    def test_optimization_convergence(
        self, service: OptimizationService, standard_constraints: OptimizationConstraints
    ):
        """Test that optimization converges successfully."""
        result = service.optimize_chunk_amount(
            balance=200000,
            interest_rate=5.5,
            monthly_payment=1500,
            constraints=standard_constraints,
            frequency="monthly",
            optimization_goal="balanced",
            method="differential_evolution",
        )

        assert result.convergence_success is True

    def test_strategy_type_classification(
        self, service: OptimizationService, standard_constraints: OptimizationConstraints
    ):
        """Test strategy type classification."""
        # Conservative strategy (low chunk)
        small_constraints = OptimizationConstraints(
            min_chunk=500.0,
            max_chunk=5000.0,
            available_loc=10000.0,
            monthly_income=5000.0,
            monthly_expenses=4000.0,
        )
        result = service.optimize_chunk_amount(
            balance=100000,
            interest_rate=5.0,
            monthly_payment=800,
            constraints=small_constraints,
            frequency="monthly",
            optimization_goal="balanced",
            method="differential_evolution",
        )
        # Should be conservative or moderate
        assert result.strategy_type in ["conservative", "moderate"]

    def test_chunk_frequencies(
        self, service: OptimizationService, standard_constraints: OptimizationConstraints
    ):
        """Test optimization with different chunk frequencies."""
        frequencies = ["monthly", "quarterly", "annual"]
        results = {}

        for freq in frequencies:
            result = service.optimize_chunk_amount(
                balance=150000,
                interest_rate=5.0,
                monthly_payment=1200,
                constraints=standard_constraints,
                frequency=freq,
                optimization_goal="balanced",
                method="differential_evolution",
            )
            results[freq] = result

        # All frequencies should produce valid results
        for freq, result in results.items():
            assert result.optimal_chunk > 0
            assert result.interest_saved > 0

    def test_edge_case_small_balance(
        self, service: OptimizationService, standard_constraints: OptimizationConstraints
    ):
        """Test optimization with small mortgage balance."""
        result = service.optimize_chunk_amount(
            balance=10000,  # Small balance
            interest_rate=5.0,
            monthly_payment=500,
            constraints=standard_constraints,
            frequency="monthly",
            optimization_goal="balanced",
            method="differential_evolution",
        )

        assert result.optimal_chunk > 0
        assert result.months_to_payoff > 0

    def test_edge_case_high_interest_rate(
        self, service: OptimizationService, standard_constraints: OptimizationConstraints
    ):
        """Test optimization with high interest rate."""
        result = service.optimize_chunk_amount(
            balance=200000,
            interest_rate=15.0,  # High rate
            monthly_payment=2000,
            constraints=standard_constraints,
            frequency="monthly",
            optimization_goal="interest",
            method="differential_evolution",
        )

        assert result.optimal_chunk > 0
        assert result.interest_saved > 0
        # High interest rate should benefit more from chunks
        assert result.interest_saved > 50000

    def test_cashflow_impact_calculation(
        self, service: OptimizationService, standard_constraints: OptimizationConstraints
    ):
        """Test monthly cashflow impact calculation."""
        result = service.optimize_chunk_amount(
            balance=200000,
            interest_rate=5.5,
            monthly_payment=1500,
            constraints=standard_constraints,
            frequency="monthly",
            optimization_goal="balanced",
            method="differential_evolution",
        )

        # Cashflow impact should be approximately chunk / 3
        expected_impact = result.optimal_chunk / 3
        assert abs(result.monthly_cashflow_impact - expected_impact) < 1.0
