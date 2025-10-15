"""HELOC controller for Flask."""
import uuid
from flask import Blueprint, jsonify, request

from models.base_flask import db
from models.heloc_flask import Heloc
from models.mortgage_flask import Mortgage

heloc_bp = Blueprint("helocs", __name__)


@heloc_bp.route("", methods=["POST"])
@heloc_bp.route("/", methods=["POST"])
def create_heloc():
    """Create a new HELOC."""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = [
            "mortgage_id",
            "credit_limit",
            "current_balance",
            "interest_rate",
            "minimum_payment",
        ]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"{field} is required"}), 400

        # Verify mortgage exists
        mortgage = Mortgage.query.get(data["mortgage_id"])
        if not mortgage:
            return jsonify({"error": "Mortgage not found"}), 404

        # Create new HELOC
        heloc = Heloc(
            id=str(uuid.uuid4()),
            mortgage_id=data["mortgage_id"],
            credit_limit=float(data["credit_limit"]),
            current_balance=float(data["current_balance"]),
            interest_rate=float(data["interest_rate"]),
            minimum_payment=float(data["minimum_payment"]),
        )

        db.session.add(heloc)
        db.session.commit()

        return jsonify(heloc.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@heloc_bp.route("/<heloc_id>", methods=["GET"])
def get_heloc(heloc_id):
    """Get a HELOC by ID."""
    try:
        heloc = Heloc.query.get(heloc_id)

        if not heloc:
            return jsonify({"error": "HELOC not found"}), 404

        return jsonify(heloc.to_dict()), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@heloc_bp.route("/mortgage/<mortgage_id>", methods=["GET"])
def get_heloc_by_mortgage(mortgage_id):
    """Get HELOC by mortgage ID."""
    try:
        heloc = Heloc.query.filter_by(mortgage_id=mortgage_id).first()

        if not heloc:
            return jsonify({"error": "HELOC not found"}), 404

        return jsonify(heloc.to_dict()), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@heloc_bp.route("/<heloc_id>", methods=["PUT"])
def update_heloc(heloc_id):
    """Update a HELOC."""
    try:
        heloc = Heloc.query.get(heloc_id)

        if not heloc:
            return jsonify({"error": "HELOC not found"}), 404

        data = request.get_json()

        # Update allowed fields
        if "credit_limit" in data:
            heloc.credit_limit = float(data["credit_limit"])
        if "current_balance" in data:
            heloc.current_balance = float(data["current_balance"])
        if "interest_rate" in data:
            heloc.interest_rate = float(data["interest_rate"])
        if "minimum_payment" in data:
            heloc.minimum_payment = float(data["minimum_payment"])

        db.session.commit()

        return jsonify(heloc.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@heloc_bp.route("/<heloc_id>", methods=["DELETE"])
def delete_heloc(heloc_id):
    """Delete a HELOC."""
    try:
        heloc = Heloc.query.get(heloc_id)

        if not heloc:
            return jsonify({"error": "HELOC not found"}), 404

        db.session.delete(heloc)
        db.session.commit()

        return jsonify({"message": "HELOC deleted"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@heloc_bp.route("/calculate-strategy", methods=["POST"])
def calculate_strategy():
    """Calculate HELOC strategy (placeholder)."""
    try:
        data = request.get_json()

        # Validate required fields
        if "mortgage_id" not in data or "chunk_amount" not in data:
            return jsonify({"error": "mortgage_id and chunk_amount are required"}), 400

        # This is a placeholder - actual calculation logic would go here
        return jsonify({
            "mortgage_id": data["mortgage_id"],
            "chunk_amount": data["chunk_amount"],
            "strategy": "placeholder",
            "estimated_savings": 0,
            "payoff_months": 0,
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@heloc_bp.route("/calculate-optimal-strategies", methods=["POST"])
def calculate_optimal_strategies():
    """Calculate optimal HELOC strategies for different target years."""
    try:
        data = request.get_json()

        # Validate required fields
        if "mortgageId" not in data:
            return jsonify({"error": "mortgageId is required"}), 400

        mortgage_id = data["mortgageId"]
        mortgage = Mortgage.query.get(mortgage_id)

        if not mortgage:
            return jsonify({"error": "Mortgage not found"}), 404

        # Check if monthly income and expenses exist
        if not mortgage.monthly_income or not mortgage.monthly_expenses:
            return jsonify({"error": "Monthly income and expenses are required"}), 400

        heloc = Heloc.query.filter_by(mortgage_id=mortgage_id).first()
        if not heloc:
            return jsonify({"error": "HELOC not found"}), 404

        # Calculate net cashflow
        net_cashflow = mortgage.monthly_income - mortgage.monthly_expenses - mortgage.monthly_payment

        # Generate scenarios for different target years
        scenarios = []
        target_years = [5, 7, 10, 12, 15]

        for years in target_years:
            target_months = years * 12
            # Simple calculation: divide balance by target months to get chunk amount
            required_chunk = mortgage.current_balance / target_months

            # Check if viable based on HELOC limit and cashflow
            is_viable = required_chunk <= heloc.credit_limit and required_chunk <= net_cashflow * 3

            if is_viable:
                # Estimate interest savings (simplified)
                total_interest = mortgage.current_balance * (mortgage.interest_rate / 100) * (years / 2)
                net_savings = total_interest * 0.4  # Assume 40% savings with velocity banking

                scenarios.append({
                    "targetYears": years,
                    "chunkAmount": round(required_chunk, 2),
                    "actualMonths": target_months,
                    "totalCycles": int(mortgage.current_balance / required_chunk),
                    "totalInterest": round(total_interest, 2),
                    "totalMortgageInterest": round(total_interest * 0.6, 2),
                    "totalHelocInterest": round(total_interest * 0.4, 2),
                    "netSavings": round(net_savings, 2),
                    "isViable": True,
                    "notes": f"{years} year payoff strategy"
                })
            else:
                scenarios.append({
                    "targetYears": years,
                    "chunkAmount": round(required_chunk, 2),
                    "actualMonths": target_months,
                    "totalCycles": 0,
                    "totalInterest": 0,
                    "totalMortgageInterest": 0,
                    "totalHelocInterest": 0,
                    "netSavings": 0,
                    "isViable": False,
                    "notes": f"Not viable - requires ${required_chunk:,.0f} chunks"
                })

        # Find recommended strategy (shortest viable timeframe with reasonable chunk)
        viable_scenarios = [s for s in scenarios if s["isViable"]]
        recommended = viable_scenarios[0] if viable_scenarios else None

        return jsonify({
            "parameters": {
                "mortgageBalance": mortgage.current_balance,
                "mortgageRate": mortgage.interest_rate,
                "helocLimit": heloc.credit_limit,
                "monthlyIncome": mortgage.monthly_income,
                "netCashflow": net_cashflow
            },
            "scenarios": scenarios,
            "recommended": recommended
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@heloc_bp.route("/calculate-strategies-for-target", methods=["POST"])
def calculate_strategies_for_target():
    """Calculate multiple strategies for a specific target year."""
    try:
        data = request.get_json()

        # Validate required fields
        if "mortgageId" not in data or "targetYears" not in data:
            return jsonify({"error": "mortgageId and targetYears are required"}), 400

        mortgage_id = data["mortgageId"]
        target_years = int(data["targetYears"])

        mortgage = Mortgage.query.get(mortgage_id)
        if not mortgage:
            return jsonify({"error": "Mortgage not found"}), 404

        # Check if monthly income and expenses exist
        if not mortgage.monthly_income or not mortgage.monthly_expenses:
            return jsonify({"error": "Monthly income and expenses are required"}), 400

        heloc = Heloc.query.filter_by(mortgage_id=mortgage_id).first()
        if not heloc:
            return jsonify({"error": "HELOC not found"}), 404

        # Calculate net cashflow
        net_cashflow = mortgage.monthly_income - mortgage.monthly_expenses - mortgage.monthly_payment

        # Generate different chunk amount strategies for the target year
        target_months = target_years * 12
        scenarios = []

        # Try different chunk amounts
        chunk_amounts = [5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000]

        for chunk in chunk_amounts:
            if chunk > heloc.credit_limit:
                continue

            # Calculate cycles needed
            cycles_needed = int(mortgage.current_balance / chunk) + 1
            actual_months = cycles_needed * (chunk / net_cashflow) if net_cashflow > 0 else 999

            # Check if viable
            is_viable = actual_months <= target_months * 1.1 and chunk <= net_cashflow * 3

            if True:  # Include all for comparison
                # Estimate interest (simplified)
                years_actual = actual_months / 12
                total_interest = mortgage.current_balance * (mortgage.interest_rate / 100) * (years_actual / 2)
                net_savings = total_interest * 0.4

                # Generate month-by-month breakdown
                cycles = []
                mortgage_balance = mortgage.current_balance
                heloc_balance = 0
                month = 0

                for cycle in range(min(cycles_needed, 60)):  # Limit to 60 months for display
                    month += 1
                    # Pull from HELOC
                    pull_amount = min(chunk, mortgage_balance)
                    heloc_balance += pull_amount
                    mortgage_balance -= pull_amount

                    cycles.append({
                        "month": month,
                        "action": "pull",
                        "helocPull": pull_amount,
                        "mortgageBalance": round(mortgage_balance, 2),
                        "helocBalance": round(heloc_balance, 2),
                        "helocInterest": round(heloc_balance * (heloc.interest_rate / 100 / 12), 2),
                        "description": f"Pull ${pull_amount:,.0f} from HELOC to pay down mortgage"
                    })

                    if mortgage_balance <= 0:
                        cycles.append({
                            "month": month + 1,
                            "action": "complete",
                            "helocPull": 0,
                            "mortgageBalance": 0,
                            "helocBalance": round(heloc_balance, 2),
                            "helocInterest": 0,
                            "description": "Mortgage paid off!"
                        })
                        break

                    # Paydown months
                    paydown_months = int(chunk / net_cashflow) if net_cashflow > 0 else 12
                    for _ in range(min(paydown_months, 12)):
                        month += 1
                        heloc_balance = max(0, heloc_balance - net_cashflow)
                        cycles.append({
                            "month": month,
                            "action": "paydown",
                            "helocPull": 0,
                            "mortgageBalance": round(mortgage_balance, 2),
                            "helocBalance": round(heloc_balance, 2),
                            "helocInterest": round(heloc_balance * (heloc.interest_rate / 100 / 12), 2),
                            "description": f"Pay down HELOC with ${net_cashflow:,.0f} cashflow"
                        })

                scenarios.append({
                    "chunkAmount": chunk,
                    "actualMonths": int(actual_months),
                    "totalCycles": cycles_needed,
                    "totalInterest": round(total_interest, 2),
                    "totalMortgageInterest": round(total_interest * 0.6, 2),
                    "totalHelocInterest": round(total_interest * 0.4, 2),
                    "netSavings": round(net_savings, 2),
                    "isViable": is_viable,
                    "notes": f"${chunk:,} chunks, {cycles_needed} cycles",
                    "cycles": cycles
                })

        # Find recommended (most viable with best savings)
        viable_scenarios = [s for s in scenarios if s["isViable"]]
        recommended = viable_scenarios[0] if viable_scenarios else (scenarios[0] if scenarios else None)

        return jsonify({
            "parameters": {
                "mortgageBalance": mortgage.current_balance,
                "mortgageRate": mortgage.interest_rate,
                "helocLimit": heloc.credit_limit,
                "netCashflow": net_cashflow
            },
            "scenarios": scenarios,
            "recommended": recommended
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
