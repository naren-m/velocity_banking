"""Calculation service for mortgage and velocity banking calculations."""
from typing import Literal
from models.schemas import AmortizationEntry, AmortizationSchedule


class CalculationService:
    """Service for mortgage calculation logic."""

    def calculate_monthly_payment(
        self, principal: float, annual_rate: float, months: int
    ) -> float:
        """Calculate monthly payment for a loan.

        Args:
            principal: Original loan principal
            annual_rate: Annual interest rate (as percentage, e.g., 5.5)
            months: Loan term in months

        Returns:
            Monthly payment amount
        """
        monthly_rate = annual_rate / 12 / 100
        if monthly_rate == 0:
            return principal / months

        payment = (principal * (monthly_rate * (1 + monthly_rate) ** months)) / (
            (1 + monthly_rate) ** months - 1
        )
        return payment

    def calculate_amortization(
        self, principal: float, annual_rate: float, monthly_payment: float
    ) -> AmortizationSchedule:
        """Generate standard amortization schedule.

        Args:
            principal: Original loan principal
            annual_rate: Annual interest rate (as percentage)
            monthly_payment: Monthly payment amount

        Returns:
            Complete amortization schedule with totals
        """
        schedule: list[AmortizationEntry] = []
        balance = principal
        monthly_rate = annual_rate / 12 / 100
        month = 0
        total_interest = 0.0

        while balance > 0.01 and month < 360:  # Max 30 years
            month += 1
            interest_payment = balance * monthly_rate
            principal_payment = min(monthly_payment - interest_payment, balance)
            balance -= principal_payment
            total_interest += interest_payment

            schedule.append(
                AmortizationEntry(
                    month=month,
                    payment=monthly_payment,
                    principal=principal_payment,
                    interest=interest_payment,
                    balance=max(0, balance),
                )
            )

        return AmortizationSchedule(
            schedule=schedule,
            total_payments=total_interest + principal,
            total_interest=total_interest,
            months_to_payoff=month,
        )

    def calculate_velocity_scenario(
        self,
        current_balance: float,
        interest_rate: float,
        monthly_payment: float,
        chunk_amount: float,
        frequency: Literal["monthly", "quarterly", "annual"],
    ) -> dict:
        """Calculate velocity banking scenario with chunk payments.

        Args:
            current_balance: Current mortgage balance
            interest_rate: Annual interest rate (as percentage)
            monthly_payment: Regular monthly payment
            chunk_amount: Chunk payment amount
            frequency: How often chunk payments are made

        Returns:
            Dictionary with schedule and totals
        """
        schedule: list[dict] = []
        balance = current_balance
        monthly_rate = interest_rate / 12 / 100
        months_per_chunk = {"monthly": 1, "quarterly": 3, "annual": 12}[frequency]
        month = 0
        total_interest = 0.0
        total_chunk_payments = 0.0

        while balance > 0.01 and month < 360:
            month += 1
            chunk_applied = 0.0

            # Apply chunk payment at intervals
            if month % months_per_chunk == 0 and chunk_amount > 0:
                chunk_to_apply = min(chunk_amount, balance)
                balance -= chunk_to_apply
                total_chunk_payments += chunk_to_apply
                chunk_applied = chunk_to_apply

                if balance <= 0.01:
                    schedule.append(
                        {
                            "month": month,
                            "payment": chunk_to_apply,
                            "principal": chunk_to_apply,
                            "interest": 0,
                            "balance": 0,
                            "chunk_applied": chunk_to_apply,
                        }
                    )
                    break

            # Regular monthly payment
            interest_payment = balance * monthly_rate
            principal_payment = min(monthly_payment - interest_payment, balance)
            balance -= principal_payment
            total_interest += interest_payment

            schedule.append(
                {
                    "month": month,
                    "payment": monthly_payment,
                    "principal": principal_payment,
                    "interest": interest_payment,
                    "balance": max(0, balance),
                    "chunk_applied": chunk_applied,
                }
            )

        return {
            "schedule": schedule,
            "total_months": month,
            "total_interest": total_interest,
            "total_chunk_payments": total_chunk_payments,
        }

    def calculate_optimal_chunk(
        self,
        current_balance: float,
        interest_rate: float,
        monthly_payment: float,
        available_loc: float,
        monthly_income: float,
        monthly_expenses: float,
    ) -> dict:
        """Calculate optimal chunk payment amount.

        Args:
            current_balance: Current mortgage balance
            interest_rate: Annual interest rate
            monthly_payment: Regular monthly payment
            available_loc: Available line of credit
            monthly_income: Monthly household income
            monthly_expenses: Monthly expenses

        Returns:
            Dictionary with recommended chunk and scenarios
        """
        monthly_net_cashflow = monthly_income - monthly_expenses

        # Conservative approach: use 80% of available LOC
        max_safe_chunk = available_loc * 0.8

        # Ensure we can replenish LOC within 3 months
        repayable_chunk = monthly_net_cashflow * 3

        # Use the smaller of the two for safety
        recommended_chunk = min(max_safe_chunk, repayable_chunk)

        # Calculate scenarios with different chunk amounts
        scenarios = []
        for multiplier in [0.5, 0.75, 1.0]:
            test_chunk = recommended_chunk * multiplier
            scenario = self.calculate_velocity_scenario(
                current_balance, interest_rate, monthly_payment, test_chunk, "monthly"
            )

            scenarios.append(
                {
                    "chunk_amount": test_chunk,
                    "months_to_payoff": scenario["total_months"],
                    "total_interest": scenario["total_interest"],
                    "monthly_cashflow_impact": test_chunk / 3,
                }
            )

        return {
            "recommended_chunk": recommended_chunk,
            "scenarios": scenarios,
            "assumptions": {
                "available_loc": available_loc,
                "monthly_net_cashflow": monthly_net_cashflow,
                "repayment_period_months": 3,
            },
        }

    def calculate_savings(
        self, standard_scenario: AmortizationSchedule, velocity_scenario: dict
    ) -> dict:
        """Calculate interest and time savings.

        Args:
            standard_scenario: Standard amortization schedule
            velocity_scenario: Velocity banking scenario

        Returns:
            Dictionary with savings analysis
        """
        interest_saved = standard_scenario.total_interest - velocity_scenario["total_interest"]
        months_saved = standard_scenario.months_to_payoff - velocity_scenario["total_months"]
        percentage_saved = (interest_saved / standard_scenario.total_interest) * 100

        return {
            "interest_saved": interest_saved,
            "months_saved": months_saved,
            "percentage_saved": percentage_saved,
        }
