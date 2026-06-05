"""Mortgage controller for Flask."""
import uuid
from datetime import datetime
from flask import Blueprint, jsonify, request

from models.base_flask import db
from models.mortgage_flask import Mortgage
from services.calculation_service import CalculationService
from middleware.error_handler import handle_errors

mortgage_bp = Blueprint("mortgages", __name__)
calculation_service = CalculationService()


def validate_positive_number(value, field_name):
    """Validate that a value is a positive number."""
    try:
        num = float(value)
        if num < 0:
            raise ValueError(f"{field_name} must be non-negative")
        return num
    except (TypeError, ValueError) as e:
        raise ValueError(f"Invalid {field_name}: {str(e)}")


@mortgage_bp.route("", methods=["POST"])
@mortgage_bp.route("/", methods=["POST"])
@handle_errors
def create_mortgage():
    """Create a new mortgage."""
    data = request.get_json()
    if not data:
        raise ValueError("Request body must be JSON")

    # Validate required fields
    required_fields = [
        "user_id",
        "principal",
        "current_balance",
        "interest_rate",
        "monthly_payment",
        "start_date",
        "term_months",
    ]
    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")

    # Validate numeric fields
    principal = validate_positive_number(data["principal"], "principal")
    current_balance = validate_positive_number(data["current_balance"], "current_balance")
    interest_rate = validate_positive_number(data["interest_rate"], "interest_rate")
    monthly_payment = validate_positive_number(data["monthly_payment"], "monthly_payment")

    # Validate term_months
    try:
        term_months = int(data["term_months"])
        if term_months <= 0:
            raise ValueError("term_months must be positive")
    except (TypeError, ValueError) as e:
        raise ValueError(f"Invalid term_months: {str(e)}")

    # Parse start_date
    try:
        start_date = datetime.fromisoformat(data["start_date"].replace("Z", "+00:00"))
    except (ValueError, AttributeError) as e:
        raise ValueError(f"Invalid start_date format: {str(e)}")

    # Validate optional fields
    monthly_income = None
    if "monthly_income" in data and data["monthly_income"] is not None:
        monthly_income = validate_positive_number(data["monthly_income"], "monthly_income")

    monthly_expenses = None
    if "monthly_expenses" in data and data["monthly_expenses"] is not None:
        monthly_expenses = validate_positive_number(data["monthly_expenses"], "monthly_expenses")

    mortgage = Mortgage(
        id=str(uuid.uuid4()),
        user_id=str(data["user_id"]),
        principal=principal,
        current_balance=current_balance,
        interest_rate=interest_rate,
        monthly_payment=monthly_payment,
        start_date=start_date,
        term_months=term_months,
        monthly_income=monthly_income,
        monthly_expenses=monthly_expenses,
    )

    db.session.add(mortgage)
    db.session.commit()

    return jsonify(mortgage.to_dict()), 201


@mortgage_bp.route("/<mortgage_id>", methods=["GET"])
def get_mortgage(mortgage_id):
    """Get a mortgage by ID."""
    mortgage = Mortgage.query.get(mortgage_id)
    if not mortgage:
        return jsonify({"error": "Mortgage not found"}), 404

    return jsonify(mortgage.to_dict())


@mortgage_bp.route("/user/<user_id>", methods=["GET"])
def get_mortgages_by_user(user_id):
    """Get all mortgages for a user."""
    mortgages = Mortgage.query.filter_by(user_id=user_id).all()
    return jsonify([m.to_dict() for m in mortgages])


@mortgage_bp.route("/<mortgage_id>", methods=["PATCH"])
@handle_errors
def update_mortgage(mortgage_id):
    """Update a mortgage."""
    mortgage = Mortgage.query.get(mortgage_id)
    if not mortgage:
        return jsonify({"error": "Mortgage not found"}), 404

    data = request.get_json()
    if not data:
        raise ValueError("Request body must be JSON")

    # Update allowed fields with validation
    if "current_balance" in data:
        mortgage.current_balance = validate_positive_number(data["current_balance"], "current_balance")
    if "monthly_payment" in data:
        mortgage.monthly_payment = validate_positive_number(data["monthly_payment"], "monthly_payment")
    if "interest_rate" in data:
        mortgage.interest_rate = validate_positive_number(data["interest_rate"], "interest_rate")
    if "monthly_income" in data:
        mortgage.monthly_income = (
            validate_positive_number(data["monthly_income"], "monthly_income")
            if data["monthly_income"] is not None
            else None
        )
    if "monthly_expenses" in data:
        mortgage.monthly_expenses = (
            validate_positive_number(data["monthly_expenses"], "monthly_expenses")
            if data["monthly_expenses"] is not None
            else None
        )

    db.session.commit()

    return jsonify(mortgage.to_dict())


@mortgage_bp.route("/<mortgage_id>", methods=["DELETE"])
def delete_mortgage(mortgage_id):
    """Delete a mortgage."""
    mortgage = Mortgage.query.get(mortgage_id)
    if not mortgage:
        return jsonify({"error": "Mortgage not found"}), 404

    db.session.delete(mortgage)
    db.session.commit()

    return "", 204


@mortgage_bp.route("/<mortgage_id>/amortization", methods=["GET"])
def get_amortization(mortgage_id):
    """Get amortization schedule for a mortgage."""
    mortgage = Mortgage.query.get(mortgage_id)
    if not mortgage:
        return jsonify({"error": "Mortgage not found"}), 404

    schedule = calculation_service.calculate_amortization(
        mortgage.current_balance,
        mortgage.interest_rate,
        mortgage.monthly_payment,
    )

    return jsonify(
        {
            "schedule": [entry.dict() for entry in schedule.schedule],
            "total_payments": schedule.total_payments,
            "total_interest": schedule.total_interest,
            "months_to_payoff": schedule.months_to_payoff,
        }
    )
