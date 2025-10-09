"""Standalone tests for optimization service (no Flask dependencies)."""
import sys
sys.path.insert(0, 'src')

from services.optimization_service import OptimizationService, OptimizationConstraints

def test_basic_optimization():
    """Test basic optimization workflow."""
    service = OptimizationService()

    # Test payoff calculation
    months, interest = service._calculate_payoff_time(
        chunk_amount=5000,
        balance=200000,
        interest_rate=5.5,
        monthly_payment=1500,
        frequency="monthly"
    )

    assert months > 0, "Months should be positive"
    assert interest > 0, "Interest should be positive"
    assert months < 360, "Should complete within 30 years"
    print(f"✓ Payoff calculation: {months} months, ${interest:.2f} interest")

    # Test optimization
    constraints = OptimizationConstraints(
        min_chunk=1000.0,
        max_chunk=20000.0,
        available_loc=50000.0,
        monthly_income=7000.0,
        monthly_expenses=4500.0
    )

    result = service.optimize_chunk_amount(
        balance=200000,
        interest_rate=5.5,
        monthly_payment=1500,
        constraints=constraints,
        frequency="monthly",
        optimization_goal="balanced",
        method="grid_search"  # Fastest method for testing
    )

    assert result.optimal_chunk > 0, "Should find positive optimal chunk"
    assert result.convergence_success, "Should converge successfully"
    assert 0 <= result.confidence_score <= 1.0, "Confidence should be 0-1"
    print(f"✓ Optimization: ${result.optimal_chunk:.2f} chunk, {result.months_to_payoff} months")
    print(f"  Interest saved: ${result.interest_saved:.2f}")
    print(f"  Confidence: {result.confidence_score:.2f}")
    print(f"  Strategy: {result.strategy_type}")

    # Test method comparison
    results = service.compare_optimization_methods(
        balance=200000,
        interest_rate=5.5,
        monthly_payment=1500,
        constraints=constraints,
        frequency="monthly",
        optimization_goal="balanced"
    )

    assert len(results) == 3, "Should have 3 methods"
    assert "scipy" in results
    assert "differential_evolution" in results
    assert "grid_search" in results
    print(f"✓ Method comparison: all 3 methods returned results")

    # Test sensitivity analysis
    sensitivities = service.sensitivity_analysis(
        balance=200000,
        interest_rate=5.5,
        monthly_payment=1500,
        constraints=constraints,
        optimal_chunk=10000.0,
        frequency="monthly",
        perturbation=0.1
    )

    assert "interest_rate" in sensitivities
    assert "chunk_amount" in sensitivities
    assert "monthly_payment" in sensitivities
    print(f"✓ Sensitivity analysis: 3 parameters tested")

    print("\n" + "="*50)
    print("ALL OPTIMIZATION TESTS PASSED ✓")
    print("="*50)

if __name__ == "__main__":
    test_basic_optimization()
