"""Investment comparison controller for Flask."""
from flask import Blueprint, jsonify, request

investment_bp = Blueprint("investment", __name__)


@investment_bp.route("/compare", methods=["POST"])
def compare_investment_scenarios():
    """Compare investing vs paying off mortgage scenarios."""
    try:
        data = request.get_json()

        # Extract parameters
        mortgage_principal = float(data.get("mortgagePrincipal", 0))
        mortgage_balance = float(data.get("mortgageBalance", 0))
        mortgage_rate = float(data.get("mortgageRate", 0)) / 100  # Convert to decimal
        mortgage_payment = float(data.get("mortgagePayment", 0))
        term_months = int(data.get("termMonths", 360))
        monthly_investment = float(data.get("monthlyInvestmentAmount", 0))
        market_return = float(data.get("averageMarketReturn", 0)) / 100  # Convert to decimal

        # Scenario 1: Invest while paying regular mortgage
        scenario1 = calculate_invest_while_paying(
            mortgage_balance, mortgage_rate, mortgage_payment, term_months, monthly_investment, market_return
        )

        # Scenario 2: Pay off mortgage first, then invest
        scenario2 = calculate_payoff_then_invest(
            mortgage_balance, mortgage_rate, mortgage_payment, monthly_investment, market_return
        )

        # Compare scenarios
        net_worth_diff = scenario2["netWorth"] - scenario1["netWorth"]
        better_scenario = "scenario2" if net_worth_diff > 0 else "scenario1"
        return_diff = scenario2["totalReturns"] - scenario1["totalReturns"]
        interest_savings = scenario1["mortgageInterestPaid"] - scenario2["mortgageInterestPaid"]

        return jsonify({
            "scenario1": scenario1,
            "scenario2": scenario2,
            "comparison": {
                "netWorthDifference": net_worth_diff,
                "betterScenario": better_scenario,
                "returnDifference": return_diff,
                "interestSavings": interest_savings,
            },
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def calculate_invest_while_paying(balance, rate, payment, term_months, monthly_invest, market_return):
    """Calculate scenario where you invest while paying regular mortgage."""
    schedule = []
    investment_balance = 0
    total_invested = 0
    total_interest_paid = 0
    mortgage_balance = balance
    monthly_rate = rate / 12
    market_monthly_rate = market_return / 12

    for month in range(1, term_months + 1):
        # Mortgage payment
        interest_payment = mortgage_balance * monthly_rate
        principal_payment = payment - interest_payment
        mortgage_balance = max(0, mortgage_balance - principal_payment)
        total_interest_paid += interest_payment

        # Investment
        investment_returns = investment_balance * market_monthly_rate
        investment_balance += monthly_invest + investment_returns
        total_invested += monthly_invest

        # Net worth = investment - remaining mortgage
        net_worth = investment_balance - mortgage_balance

        schedule.append({
            "month": month,
            "investmentBalance": round(investment_balance, 2),
            "investmentContribution": monthly_invest,
            "investmentReturns": round(investment_returns, 2),
            "mortgageBalance": round(mortgage_balance, 2),
            "mortgageInterestPaid": round(interest_payment, 2),
            "totalInvested": round(total_invested, 2),
            "netWorth": round(net_worth, 2),
        })

        if mortgage_balance <= 0:
            break

    return {
        "name": "Invest While Paying Mortgage",
        "description": f"Continue regular ${payment:,.0f}/month mortgage payments while investing ${monthly_invest:,.0f}/month",
        "schedule": schedule,
        "totalMonths": len(schedule),
        "totalInvested": round(total_invested, 2),
        "finalInvestmentValue": round(investment_balance, 2),
        "totalReturns": round(investment_balance - total_invested, 2),
        "mortgageInterestPaid": round(total_interest_paid, 2),
        "netWorth": round(investment_balance - mortgage_balance, 2),
    }


def calculate_payoff_then_invest(balance, rate, payment, monthly_invest, market_return):
    """Calculate scenario where you pay off mortgage first, then invest."""
    schedule = []
    investment_balance = 0
    total_invested = 0
    total_interest_paid = 0
    mortgage_balance = balance
    monthly_rate = rate / 12
    market_monthly_rate = market_return / 12
    payoff_month = 0

    # Phase 1: Pay off mortgage with extra payments
    extra_payment = monthly_invest
    total_payment = payment + extra_payment
    month = 0

    while mortgage_balance > 0 and month < 1000:  # Safety limit
        month += 1
        interest_payment = mortgage_balance * monthly_rate
        principal_payment = total_payment - interest_payment
        mortgage_balance = max(0, mortgage_balance - principal_payment)
        total_interest_paid += interest_payment

        schedule.append({
            "month": month,
            "investmentBalance": 0,
            "investmentContribution": 0,
            "investmentReturns": 0,
            "mortgageBalance": round(mortgage_balance, 2),
            "mortgageInterestPaid": round(interest_payment, 2),
            "totalInvested": 0,
            "netWorth": round(-mortgage_balance, 2),
        })

        if mortgage_balance <= 0:
            payoff_month = month
            break

    # Phase 2: Invest freed-up money (payment + extra)
    freed_up_amount = payment + extra_payment
    remaining_months = 360 - payoff_month  # Invest for remaining mortgage term

    for i in range(1, remaining_months + 1):
        month = payoff_month + i
        investment_returns = investment_balance * market_monthly_rate
        investment_balance += freed_up_amount + investment_returns
        total_invested += freed_up_amount

        schedule.append({
            "month": month,
            "investmentBalance": round(investment_balance, 2),
            "investmentContribution": freed_up_amount,
            "investmentReturns": round(investment_returns, 2),
            "totalInvested": round(total_invested, 2),
            "netWorth": round(investment_balance, 2),
        })

    return {
        "name": "Pay Off Mortgage First",
        "description": f"Pay extra ${monthly_invest:,.0f}/month to eliminate mortgage, then invest ${freed_up_amount:,.0f}/month",
        "schedule": schedule,
        "totalMonths": len(schedule),
        "totalInvested": round(total_invested, 2),
        "finalInvestmentValue": round(investment_balance, 2),
        "totalReturns": round(investment_balance - total_invested, 2),
        "mortgageInterestPaid": round(total_interest_paid, 2),
        "payoffMonth": payoff_month,
        "netWorth": round(investment_balance, 2),
    }
