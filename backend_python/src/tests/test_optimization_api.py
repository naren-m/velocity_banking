"""Integration tests for optimization API endpoints."""
import pytest
from flask import Flask


@pytest.fixture
def client():
    """Create test client."""
    from ..app import create_app

    app = create_app()
    app.config["TESTING"] = True

    with app.test_client() as client:
        yield client


class TestOptimizationAPI:
    """Test optimization API endpoints."""

    def test_optimize_chunk_endpoint(self, client):
        """Test optimal chunk optimization endpoint."""
        data = {
            "balance": 200000,
            "interest_rate": 5.5,
            "monthly_payment": 1500,
            "available_loc": 50000,
            "monthly_income": 7000,
            "monthly_expenses": 4500,
            "frequency": "monthly",
            "optimization_goal": "balanced",
            "method": "differential_evolution",
        }

        response = client.post("/api/optimize/chunk", json=data)

        assert response.status_code == 200
        result = response.get_json()

        assert "optimal_chunk" in result
        assert "months_to_payoff" in result
        assert "total_interest" in result
        assert "interest_saved" in result
        assert "confidence_score" in result
        assert "strategy_type" in result

        assert result["optimal_chunk"] > 0
        assert result["interest_saved"] > 0
        assert 0 <= result["confidence_score"] <= 1.0

    def test_optimize_chunk_interest_goal(self, client):
        """Test optimization with interest minimization goal."""
        data = {
            "balance": 150000,
            "interest_rate": 5.0,
            "monthly_payment": 1200,
            "available_loc": 40000,
            "monthly_income": 6500,
            "monthly_expenses": 4000,
            "optimization_goal": "interest",
        }

        response = client.post("/api/optimize/chunk", json=data)

        assert response.status_code == 200
        result = response.get_json()

        assert result["optimization_goal"] == "interest"
        assert result["interest_saved"] > 0

    def test_optimize_chunk_time_goal(self, client):
        """Test optimization with time minimization goal."""
        data = {
            "balance": 150000,
            "interest_rate": 5.0,
            "monthly_payment": 1200,
            "available_loc": 40000,
            "monthly_income": 6500,
            "monthly_expenses": 4000,
            "optimization_goal": "time",
        }

        response = client.post("/api/optimize/chunk", json=data)

        assert response.status_code == 200
        result = response.get_json()

        assert result["optimization_goal"] == "time"
        assert result["months_to_payoff"] > 0

    def test_compare_methods_endpoint(self, client):
        """Test method comparison endpoint."""
        data = {
            "balance": 200000,
            "interest_rate": 5.5,
            "monthly_payment": 1500,
            "available_loc": 50000,
            "monthly_income": 7000,
            "monthly_expenses": 4500,
            "frequency": "monthly",
            "optimization_goal": "balanced",
        }

        response = client.post("/api/optimize/compare-methods", json=data)

        assert response.status_code == 200
        result = response.get_json()

        assert "scipy" in result
        assert "differential_evolution" in result
        assert "grid_search" in result

        for method, method_result in result.items():
            assert "optimal_chunk" in method_result
            assert "interest_saved" in method_result
            assert method_result["optimal_chunk"] > 0

    def test_multi_objective_endpoint(self, client):
        """Test multi-objective optimization endpoint."""
        data = {
            "balance": 200000,
            "interest_rate": 5.5,
            "monthly_payment": 1500,
            "available_loc": 50000,
            "monthly_income": 7000,
            "monthly_expenses": 4500,
            "frequency": "monthly",
        }

        response = client.post("/api/optimize/multi-objective", json=data)

        assert response.status_code == 200
        result = response.get_json()

        assert "pareto_optimal_solutions" in result
        assert "objectives" in result

        solutions = result["pareto_optimal_solutions"]
        assert len(solutions) == 3

        for solution in solutions:
            assert "optimal_chunk" in solution
            assert "interest_saved" in solution
            assert solution["optimal_chunk"] > 0

    def test_sensitivity_analysis_endpoint(self, client):
        """Test sensitivity analysis endpoint."""
        data = {
            "balance": 200000,
            "interest_rate": 5.5,
            "monthly_payment": 1500,
            "optimal_chunk": 10000,
            "available_loc": 50000,
            "monthly_income": 7000,
            "monthly_expenses": 4500,
            "frequency": "monthly",
            "perturbation": 0.1,
        }

        response = client.post("/api/optimize/sensitivity", json=data)

        assert response.status_code == 200
        result = response.get_json()

        assert "sensitivities" in result
        assert "perturbation_pct" in result
        assert "interpretation" in result

        sensitivities = result["sensitivities"]
        assert "interest_rate" in sensitivities
        assert "chunk_amount" in sensitivities
        assert "monthly_payment" in sensitivities

        for param, metrics in sensitivities.items():
            assert "months_change" in metrics
            assert "interest_change" in metrics

    def test_invalid_input_handling(self, client):
        """Test API handles invalid input gracefully."""
        data = {
            "balance": -100000,  # Invalid negative
            "interest_rate": 5.5,
            "monthly_payment": 1500,
            "available_loc": 50000,
            "monthly_income": 7000,
            "monthly_expenses": 4500,
        }

        response = client.post("/api/optimize/chunk", json=data)

        # Should return error, not crash
        assert response.status_code in [400, 500]
