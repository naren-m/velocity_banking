"""Calculation controller for velocity banking calculations."""
from flask import Blueprint, jsonify, request

from services.calculation_service import CalculationService
from models.mortgage_flask import Mortgage

calculation_bp = Blueprint("calculation", __name__)
calculation_service = CalculationService()


@calculation_bp.route("/velocity", methods=["POST"])
def velocity_scenario():
    """Calculate velocity banking scenario with chunk payments.

    Request body:
    {
        "mortgageId": "string",
        "chunkAmount": 5000,
        "frequency": "monthly|quarterly|annual"
    }
    """
    try:
        data = request.get_json()

        # Get mortgage data
        mortgage_id = data.get("mortgageId")
        mortgage = Mortgage.query.get(mortgage_id)

        if not mortgage:
            return jsonify({"error": "Mortgage not found"}), 404

        # Extract parameters
        chunk_amount = float(data.get("chunkAmount", 0))
        frequency = data.get("frequency", "monthly")

        # Calculate velocity scenario
        result = calculation_service.calculate_velocity_scenario(
            current_balance=mortgage.current_balance,
            interest_rate=mortgage.interest_rate,
            monthly_payment=mortgage.monthly_payment,
            chunk_amount=chunk_amount,
            frequency=frequency,
        )

        return jsonify({
            "schedule": result["schedule"],
            "totalMonths": result["total_months"],
            "totalInterest": result["total_interest"],
            "totalChunkPayments": result["total_chunk_payments"],
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@calculation_bp.route("/optimal-chunk", methods=["POST"])
def optimal_chunk():
    """Calculate optimal chunk payment amount.

    Request body:
    {
        "mortgageId": "string",
        "availableLOC": 50000,
        "monthlyIncome": 7000,
        "monthlyExpenses": 4500
    }
    """
    try:
        data = request.get_json()

        # Get mortgage data
        mortgage_id = data.get("mortgageId")
        mortgage = Mortgage.query.get(mortgage_id)

        if not mortgage:
            return jsonify({"error": "Mortgage not found"}), 404

        # Extract parameters
        available_loc = float(data.get("availableLOC", 0))
        monthly_income = float(data.get("monthlyIncome", 0))
        monthly_expenses = float(data.get("monthlyExpenses", 0))

        # Calculate optimal chunk
        result = calculation_service.calculate_optimal_chunk(
            current_balance=mortgage.current_balance,
            interest_rate=mortgage.interest_rate,
            monthly_payment=mortgage.monthly_payment,
            available_loc=available_loc,
            monthly_income=monthly_income,
            monthly_expenses=monthly_expenses,
        )

        return jsonify({
            "recommendedChunk": result["recommended_chunk"],
            "scenarios": result["scenarios"],
            "assumptions": result["assumptions"],
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@calculation_bp.route("/compare", methods=["POST"])
def compare_scenarios():
    """Compare standard amortization vs velocity banking.

    Request body:
    {
        "mortgageId": "string",
        "chunkAmount": 5000,
        "frequency": "monthly|quarterly|annual"
    }
    """
    try:
        data = request.get_json()

        # Get mortgage data
        mortgage_id = data.get("mortgageId")
        mortgage = Mortgage.query.get(mortgage_id)

        if not mortgage:
            return jsonify({"error": "Mortgage not found"}), 404

        # Extract parameters
        chunk_amount = float(data.get("chunkAmount", 0))
        frequency = data.get("frequency", "monthly")

        # Calculate standard amortization
        standard_scenario = calculation_service.calculate_amortization(
            principal=mortgage.current_balance,
            annual_rate=mortgage.interest_rate,
            monthly_payment=mortgage.monthly_payment,
        )

        # Calculate velocity banking scenario
        velocity_scenario = calculation_service.calculate_velocity_scenario(
            current_balance=mortgage.current_balance,
            interest_rate=mortgage.interest_rate,
            monthly_payment=mortgage.monthly_payment,
            chunk_amount=chunk_amount,
            frequency=frequency,
        )

        # Calculate savings
        savings = calculation_service.calculate_savings(
            standard_scenario=standard_scenario,
            velocity_scenario=velocity_scenario,
        )

        return jsonify({
            "standard": {
                "monthsToPayoff": standard_scenario.months_to_payoff,
                "totalInterest": standard_scenario.total_interest,
                "totalPayments": standard_scenario.total_payments,
            },
            "velocity": {
                "monthsToPayoff": velocity_scenario["total_months"],
                "totalInterest": velocity_scenario["total_interest"],
                "totalChunkPayments": velocity_scenario["total_chunk_payments"],
            },
            "savings": {
                "interestSaved": savings["interest_saved"],
                "monthsSaved": savings["months_saved"],
                "percentageSaved": savings["percentage_saved"],
            },
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
