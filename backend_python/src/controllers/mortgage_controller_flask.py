"""Mortgage controller for Flask."""
import uuid
from datetime import datetime
from flask import Blueprint, jsonify, request

from models.base_flask import db
from models.mortgage_flask import Mortgage
from services.calculation_service import CalculationService

mortgage_bp = Blueprint("mortgages", __name__)
calculation_service = CalculationService()


@mortgage_bp.route("/", methods=["POST"])
def create_mortgage():
    """Create a new mortgage."""
    try:
        data = request.get_json()

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
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Parse start_date
        start_date = datetime.fromisoformat(data["start_date"].replace("Z", "+00:00"))

        mortgage = Mortgage(
            id=str(uuid.uuid4()),
            user_id=data["user_id"],
            principal=float(data["principal"]),
            current_balance=float(data["current_balance"]),
            interest_rate=float(data["interest_rate"]),
            monthly_payment=float(data["monthly_payment"]),
            start_date=start_date,
            term_months=int(data["term_months"]),
            monthly_income=float(data.get("monthly_income")) if "monthly_income" in data else None,
            monthly_expenses=(
                float(data.get("monthly_expenses")) if "monthly_expenses" in data else None
            ),
        )

        db.session.add(mortgage)
        db.session.commit()

        return jsonify(mortgage.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


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
def update_mortgage(mortgage_id):
    """Update a mortgage."""
    try:
        mortgage = Mortgage.query.get(mortgage_id)
        if not mortgage:
            return jsonify({"error": "Mortgage not found"}), 404

        data = request.get_json()

        # Update allowed fields
        if "current_balance" in data:
            mortgage.current_balance = float(data["current_balance"])
        if "monthly_payment" in data:
            mortgage.monthly_payment = float(data["monthly_payment"])
        if "interest_rate" in data:
            mortgage.interest_rate = float(data["interest_rate"])

        db.session.commit()

        return jsonify(mortgage.to_dict())

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


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
