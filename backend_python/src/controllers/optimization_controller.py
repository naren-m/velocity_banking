"""Optimization controller for scientific strategy optimization."""
from flask import Blueprint, jsonify, request

from services.optimization_service import (
    OptimizationService,
    OptimizationConstraints,
)

optimization_bp = Blueprint("optimization", __name__)
optimization_service = OptimizationService()


@optimization_bp.route("/chunk", methods=["POST"])
def optimize_chunk():
    """Find optimal chunk payment amount using scientific optimization.

    Request body:
    {
        "balance": 200000,
        "interest_rate": 5.5,
        "monthly_payment": 1500,
        "available_loc": 50000,
        "monthly_income": 7000,
        "monthly_expenses": 4500,
        "frequency": "monthly",
        "optimization_goal": "balanced",
        "method": "differential_evolution"
    }
    """
    try:
        data = request.get_json()

        # Extract parameters
        balance = float(data.get("balance"))
        interest_rate = float(data.get("interest_rate"))
        monthly_payment = float(data.get("monthly_payment"))
        available_loc = float(data.get("available_loc"))
        monthly_income = float(data.get("monthly_income"))
        monthly_expenses = float(data.get("monthly_expenses"))

        # Optional parameters
        frequency = data.get("frequency", "monthly")
        optimization_goal = data.get("optimization_goal", "balanced")
        method = data.get("method", "differential_evolution")

        # Calculate constraints
        monthly_cashflow = monthly_income - monthly_expenses
        min_chunk = max(1000, monthly_cashflow * 0.5)  # At least $1000 or 50% of cashflow
        max_chunk = min(available_loc * 0.9, monthly_cashflow * 6)  # 90% LOC or 6 months cashflow

        constraints = OptimizationConstraints(
            min_chunk=min_chunk,
            max_chunk=max_chunk,
            available_loc=available_loc,
            monthly_income=monthly_income,
            monthly_expenses=monthly_expenses,
        )

        # Run optimization
        result = optimization_service.optimize_chunk_amount(
            balance=balance,
            interest_rate=interest_rate,
            monthly_payment=monthly_payment,
            constraints=constraints,
            frequency=frequency,
            optimization_goal=optimization_goal,
            method=method,
        )

        return jsonify(
            {
                "optimal_chunk": result.optimal_chunk,
                "months_to_payoff": result.months_to_payoff,
                "total_interest": result.total_interest,
                "interest_saved": result.interest_saved,
                "monthly_cashflow_impact": result.monthly_cashflow_impact,
                "confidence_score": result.confidence_score,
                "strategy_type": result.strategy_type,
                "convergence_success": result.convergence_success,
                "constraints": {
                    "min_chunk": constraints.min_chunk,
                    "max_chunk": constraints.max_chunk,
                    "available_loc": constraints.available_loc,
                },
                "method_used": method,
                "optimization_goal": optimization_goal,
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@optimization_bp.route("/compare-methods", methods=["POST"])
def compare_methods():
    """Compare different optimization methods."""
    try:
        data = request.get_json()

        balance = float(data.get("balance"))
        interest_rate = float(data.get("interest_rate"))
        monthly_payment = float(data.get("monthly_payment"))
        available_loc = float(data.get("available_loc"))
        monthly_income = float(data.get("monthly_income"))
        monthly_expenses = float(data.get("monthly_expenses"))
        frequency = data.get("frequency", "monthly")
        optimization_goal = data.get("optimization_goal", "balanced")

        # Calculate constraints
        monthly_cashflow = monthly_income - monthly_expenses
        min_chunk = max(1000, monthly_cashflow * 0.5)
        max_chunk = min(available_loc * 0.9, monthly_cashflow * 6)

        constraints = OptimizationConstraints(
            min_chunk=min_chunk,
            max_chunk=max_chunk,
            available_loc=available_loc,
            monthly_income=monthly_income,
            monthly_expenses=monthly_expenses,
        )

        # Compare methods
        results = optimization_service.compare_optimization_methods(
            balance=balance,
            interest_rate=interest_rate,
            monthly_payment=monthly_payment,
            constraints=constraints,
            frequency=frequency,
            optimization_goal=optimization_goal,
        )

        return jsonify(
            {
                method: {
                    "optimal_chunk": result.optimal_chunk,
                    "months_to_payoff": result.months_to_payoff,
                    "total_interest": result.total_interest,
                    "interest_saved": result.interest_saved,
                    "confidence_score": result.confidence_score,
                    "strategy_type": result.strategy_type,
                    "convergence_success": result.convergence_success,
                }
                for method, result in results.items()
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@optimization_bp.route("/multi-objective", methods=["POST"])
def multi_objective():
    """Perform multi-objective optimization (Pareto-optimal solutions)."""
    try:
        data = request.get_json()

        balance = float(data.get("balance"))
        interest_rate = float(data.get("interest_rate"))
        monthly_payment = float(data.get("monthly_payment"))
        available_loc = float(data.get("available_loc"))
        monthly_income = float(data.get("monthly_income"))
        monthly_expenses = float(data.get("monthly_expenses"))
        frequency = data.get("frequency", "monthly")

        # Calculate constraints
        monthly_cashflow = monthly_income - monthly_expenses
        min_chunk = max(1000, monthly_cashflow * 0.5)
        max_chunk = min(available_loc * 0.9, monthly_cashflow * 6)

        constraints = OptimizationConstraints(
            min_chunk=min_chunk,
            max_chunk=max_chunk,
            available_loc=available_loc,
            monthly_income=monthly_income,
            monthly_expenses=monthly_expenses,
        )

        # Get Pareto-optimal solutions
        results = optimization_service.multi_objective_optimization(
            balance=balance,
            interest_rate=interest_rate,
            monthly_payment=monthly_payment,
            constraints=constraints,
            frequency=frequency,
        )

        return jsonify(
            {
                "pareto_optimal_solutions": [
                    {
                        "optimal_chunk": result.optimal_chunk,
                        "months_to_payoff": result.months_to_payoff,
                        "total_interest": result.total_interest,
                        "interest_saved": result.interest_saved,
                        "monthly_cashflow_impact": result.monthly_cashflow_impact,
                        "confidence_score": result.confidence_score,
                        "strategy_type": result.strategy_type,
                    }
                    for result in results
                ],
                "objectives": ["minimize_interest", "minimize_time", "balanced"],
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@optimization_bp.route("/sensitivity", methods=["POST"])
def sensitivity_analysis():
    """Perform sensitivity analysis on optimal solution."""
    try:
        data = request.get_json()

        balance = float(data.get("balance"))
        interest_rate = float(data.get("interest_rate"))
        monthly_payment = float(data.get("monthly_payment"))
        optimal_chunk = float(data.get("optimal_chunk"))
        available_loc = float(data.get("available_loc"))
        monthly_income = float(data.get("monthly_income"))
        monthly_expenses = float(data.get("monthly_expenses"))
        frequency = data.get("frequency", "monthly")
        perturbation = float(data.get("perturbation", 0.1))

        # Calculate constraints
        monthly_cashflow = monthly_income - monthly_expenses
        min_chunk = max(1000, monthly_cashflow * 0.5)
        max_chunk = min(available_loc * 0.9, monthly_cashflow * 6)

        constraints = OptimizationConstraints(
            min_chunk=min_chunk,
            max_chunk=max_chunk,
            available_loc=available_loc,
            monthly_income=monthly_income,
            monthly_expenses=monthly_expenses,
        )

        # Run sensitivity analysis
        sensitivities = optimization_service.sensitivity_analysis(
            balance=balance,
            interest_rate=interest_rate,
            monthly_payment=monthly_payment,
            constraints=constraints,
            optimal_chunk=optimal_chunk,
            frequency=frequency,
            perturbation=perturbation,
        )

        return jsonify(
            {
                "sensitivities": sensitivities,
                "perturbation_pct": perturbation * 100,
                "interpretation": {
                    "interest_rate": "Impact of interest rate changes on payoff time and interest",
                    "chunk_amount": "Impact of chunk amount changes on payoff time and interest",
                    "monthly_payment": "Impact of monthly payment changes on payoff time and interest",
                },
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500
