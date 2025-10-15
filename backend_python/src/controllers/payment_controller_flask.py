"""Payment controller for Flask."""
import uuid
from flask import Blueprint, jsonify, request
from sqlalchemy import func

from models.base_flask import db
from models.payment_flask import Payment
from models.mortgage_flask import Mortgage

payment_bp = Blueprint("payments", __name__)


@payment_bp.route("", methods=["POST"])
@payment_bp.route("/", methods=["POST"])
def create_payment():
    """Create a new payment."""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ["mortgage_id", "amount", "payment_type"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"{field} is required"}), 400

        # Verify mortgage exists
        mortgage = Mortgage.query.get(data["mortgage_id"])
        if not mortgage:
            return jsonify({"error": "Mortgage not found"}), 404

        # Create payment
        payment = Payment(
            id=str(uuid.uuid4()),
            mortgage_id=data["mortgage_id"],
            amount=float(data["amount"]),
            payment_type=data["payment_type"],
            principal_amount=data.get("principal_amount"),
            interest_amount=data.get("interest_amount"),
        )

        db.session.add(payment)
        db.session.commit()

        return jsonify(payment.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@payment_bp.route("/<payment_id>", methods=["GET"])
def get_payment(payment_id):
    """Get a payment by ID."""
    try:
        payment = Payment.query.get(payment_id)

        if not payment:
            return jsonify({"error": "Payment not found"}), 404

        return jsonify(payment.to_dict()), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@payment_bp.route("/mortgage/<mortgage_id>", methods=["GET"])
def get_payments_by_mortgage(mortgage_id):
    """Get payments for a mortgage."""
    try:
        # Get limit from query params
        limit = request.args.get("limit", 50, type=int)

        payments = (
            Payment.query.filter_by(mortgage_id=mortgage_id)
            .order_by(Payment.payment_date.desc())
            .limit(limit)
            .all()
        )

        return jsonify([payment.to_dict() for payment in payments]), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@payment_bp.route("/mortgage/<mortgage_id>/totals", methods=["GET"])
def get_payment_totals(mortgage_id):
    """Get payment totals for a mortgage."""
    try:
        totals = db.session.query(
            func.sum(Payment.amount).label("total_paid"),
            func.sum(Payment.principal_amount).label("total_principal"),
            func.sum(Payment.interest_amount).label("total_interest"),
        ).filter(Payment.mortgage_id == mortgage_id).first()

        return jsonify({
            "total_paid": float(totals.total_paid or 0),
            "total_principal": float(totals.total_principal or 0),
            "total_interest": float(totals.total_interest or 0),
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@payment_bp.route("/<payment_id>", methods=["DELETE"])
def delete_payment(payment_id):
    """Delete a payment."""
    try:
        payment = Payment.query.get(payment_id)

        if not payment:
            return jsonify({"error": "Payment not found"}), 404

        db.session.delete(payment)
        db.session.commit()

        return jsonify({"message": "Payment deleted"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
