"""Scientific optimization service for velocity banking strategies."""
import numpy as np
from scipy.optimize import minimize, differential_evolution, Bounds
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass


@dataclass
class OptimizationConstraints:
    """Constraints for optimization problem."""

    min_chunk: float
    max_chunk: float
    available_loc: float
    monthly_income: float
    monthly_expenses: float
    min_cashflow_reserve: float = 1000.0
    max_debt_to_income: float = 0.43


@dataclass
class OptimizationResult:
    """Result from optimization."""

    optimal_chunk: float
    months_to_payoff: int
    total_interest: float
    interest_saved: float
    monthly_cashflow_impact: float
    confidence_score: float
    strategy_type: str
    convergence_success: bool


class OptimizationService:
    """Service for scientific optimization of velocity banking strategies."""

    def __init__(self):
        """Initialize optimization service."""
        self.tolerance = 1e-6
        self.max_iterations = 1000

    def _calculate_payoff_time(
        self,
        chunk_amount: float,
        balance: float,
        interest_rate: float,
        monthly_payment: float,
        frequency: str = "monthly",
    ) -> Tuple[int, float]:
        """Calculate payoff time and total interest for given chunk amount.

        Args:
            chunk_amount: Chunk payment amount
            balance: Current mortgage balance
            interest_rate: Annual interest rate (as percentage)
            monthly_payment: Regular monthly payment
            frequency: Chunk payment frequency

        Returns:
            Tuple of (months to payoff, total interest paid)
        """
        monthly_rate = interest_rate / 12 / 100
        months_per_chunk = {"monthly": 1, "quarterly": 3, "annual": 12}.get(frequency, 1)

        current_balance = balance
        month = 0
        total_interest = 0.0
        max_months = 360  # 30 years max

        while current_balance > 0.01 and month < max_months:
            month += 1

            # Apply chunk payment at intervals
            if month % months_per_chunk == 0 and chunk_amount > 0:
                chunk_to_apply = min(chunk_amount, current_balance)
                current_balance -= chunk_to_apply

                if current_balance <= 0.01:
                    break

            # Regular monthly payment
            interest_payment = current_balance * monthly_rate
            principal_payment = min(monthly_payment - interest_payment, current_balance)
            current_balance -= principal_payment
            total_interest += interest_payment

        return month, total_interest

    def _objective_function(
        self,
        chunk_amount: np.ndarray,
        balance: float,
        interest_rate: float,
        monthly_payment: float,
        frequency: str,
        optimization_goal: str,
    ) -> float:
        """Objective function to minimize.

        Args:
            chunk_amount: Chunk payment amount (optimization variable)
            balance: Current mortgage balance
            interest_rate: Annual interest rate
            monthly_payment: Regular monthly payment
            frequency: Chunk payment frequency
            optimization_goal: What to optimize ('interest', 'time', 'balanced')

        Returns:
            Value to minimize
        """
        chunk = float(chunk_amount[0])
        months, interest = self._calculate_payoff_time(
            chunk, balance, interest_rate, monthly_payment, frequency
        )

        if optimization_goal == "interest":
            # Minimize total interest paid
            return interest
        elif optimization_goal == "time":
            # Minimize time to payoff (weighted by interest to avoid extreme solutions)
            return months + (interest / 10000)
        else:  # balanced
            # Balanced optimization: minimize weighted combination
            # Normalize both values and combine
            normalized_interest = interest / balance  # Interest as fraction of balance
            normalized_time = months / 360  # Time as fraction of 30 years
            return 0.6 * normalized_interest + 0.4 * normalized_time

    def _calculate_confidence_score(
        self,
        optimal_chunk: float,
        constraints: OptimizationConstraints,
        convergence_success: bool,
    ) -> float:
        """Calculate confidence score for optimization result.

        Args:
            optimal_chunk: Optimal chunk amount found
            constraints: Optimization constraints
            convergence_success: Whether optimization converged

        Returns:
            Confidence score (0-1)
        """
        if not convergence_success:
            return 0.3

        score = 1.0

        # Check chunk amount relative to bounds
        chunk_range = constraints.max_chunk - constraints.min_chunk
        if chunk_range > 0:
            # Prefer solutions not at extremes
            relative_position = (optimal_chunk - constraints.min_chunk) / chunk_range
            if relative_position < 0.1 or relative_position > 0.9:
                score -= 0.2

        # Check cashflow safety
        monthly_cashflow = constraints.monthly_income - constraints.monthly_expenses
        repayment_period = 3  # months
        if optimal_chunk > monthly_cashflow * repayment_period:
            score -= 0.3

        # Check LOC utilization
        loc_utilization = optimal_chunk / constraints.available_loc
        if loc_utilization > 0.9:
            score -= 0.1

        return max(0.0, min(1.0, score))

    def optimize_chunk_amount(
        self,
        balance: float,
        interest_rate: float,
        monthly_payment: float,
        constraints: OptimizationConstraints,
        frequency: str = "monthly",
        optimization_goal: str = "balanced",
        method: str = "differential_evolution",
    ) -> OptimizationResult:
        """Find optimal chunk payment amount using scientific optimization.

        Args:
            balance: Current mortgage balance
            interest_rate: Annual interest rate (as percentage)
            monthly_payment: Regular monthly payment
            constraints: Optimization constraints
            frequency: Chunk payment frequency
            optimization_goal: 'interest', 'time', or 'balanced'
            method: Optimization method ('scipy', 'differential_evolution', 'grid_search')

        Returns:
            OptimizationResult with optimal chunk and metrics
        """
        # Define bounds
        bounds = Bounds([constraints.min_chunk], [constraints.max_chunk])

        if method == "differential_evolution":
            # Global optimization - more robust but slower
            result = differential_evolution(
                lambda x: self._objective_function(
                    x, balance, interest_rate, monthly_payment, frequency, optimization_goal
                ),
                bounds=[(constraints.min_chunk, constraints.max_chunk)],
                maxiter=self.max_iterations,
                tol=self.tolerance,
                seed=42,
                workers=1,
            )
            optimal_chunk = result.x[0]
            convergence_success = result.success

        elif method == "grid_search":
            # Grid search for comparison
            chunk_values = np.linspace(
                constraints.min_chunk, constraints.max_chunk, num=50
            )
            best_chunk = constraints.min_chunk
            best_value = float("inf")

            for chunk in chunk_values:
                value = self._objective_function(
                    np.array([chunk]),
                    balance,
                    interest_rate,
                    monthly_payment,
                    frequency,
                    optimization_goal,
                )
                if value < best_value:
                    best_value = value
                    best_chunk = chunk

            optimal_chunk = best_chunk
            convergence_success = True

        else:  # scipy minimize
            # Local optimization - faster but may find local minima
            initial_guess = [(constraints.min_chunk + constraints.max_chunk) / 2]
            result = minimize(
                lambda x: self._objective_function(
                    x, balance, interest_rate, monthly_payment, frequency, optimization_goal
                ),
                x0=initial_guess,
                bounds=bounds,
                method="L-BFGS-B",
                options={"maxiter": self.max_iterations},
            )
            optimal_chunk = result.x[0]
            convergence_success = result.success

        # Calculate metrics for optimal solution
        months_optimal, interest_optimal = self._calculate_payoff_time(
            optimal_chunk, balance, interest_rate, monthly_payment, frequency
        )

        # Calculate baseline (no chunks)
        _, interest_baseline = self._calculate_payoff_time(
            0, balance, interest_rate, monthly_payment, frequency
        )

        interest_saved = interest_baseline - interest_optimal

        # Calculate cashflow impact
        monthly_cashflow_impact = optimal_chunk / 3  # Assume 3-month repayment

        # Calculate confidence score
        confidence_score = self._calculate_confidence_score(
            optimal_chunk, constraints, convergence_success
        )

        # Determine strategy type
        if optimal_chunk < constraints.available_loc * 0.3:
            strategy_type = "conservative"
        elif optimal_chunk > constraints.available_loc * 0.7:
            strategy_type = "aggressive"
        else:
            strategy_type = "moderate"

        return OptimizationResult(
            optimal_chunk=round(optimal_chunk, 2),
            months_to_payoff=months_optimal,
            total_interest=round(interest_optimal, 2),
            interest_saved=round(interest_saved, 2),
            monthly_cashflow_impact=round(monthly_cashflow_impact, 2),
            confidence_score=round(confidence_score, 2),
            strategy_type=strategy_type,
            convergence_success=convergence_success,
        )

    def compare_optimization_methods(
        self,
        balance: float,
        interest_rate: float,
        monthly_payment: float,
        constraints: OptimizationConstraints,
        frequency: str = "monthly",
        optimization_goal: str = "balanced",
    ) -> Dict[str, OptimizationResult]:
        """Compare different optimization methods.

        Args:
            balance: Current mortgage balance
            interest_rate: Annual interest rate
            monthly_payment: Regular monthly payment
            constraints: Optimization constraints
            frequency: Chunk payment frequency
            optimization_goal: Optimization objective

        Returns:
            Dictionary of method name to optimization result
        """
        methods = ["scipy", "differential_evolution", "grid_search"]
        results = {}

        for method in methods:
            results[method] = self.optimize_chunk_amount(
                balance,
                interest_rate,
                monthly_payment,
                constraints,
                frequency,
                optimization_goal,
                method,
            )

        return results

    def multi_objective_optimization(
        self,
        balance: float,
        interest_rate: float,
        monthly_payment: float,
        constraints: OptimizationConstraints,
        frequency: str = "monthly",
    ) -> List[OptimizationResult]:
        """Perform multi-objective optimization.

        Returns Pareto-optimal solutions for different objectives.

        Args:
            balance: Current mortgage balance
            interest_rate: Annual interest rate
            monthly_payment: Regular monthly payment
            constraints: Optimization constraints
            frequency: Chunk payment frequency

        Returns:
            List of Pareto-optimal solutions
        """
        objectives = ["interest", "time", "balanced"]
        results = []

        for objective in objectives:
            result = self.optimize_chunk_amount(
                balance,
                interest_rate,
                monthly_payment,
                constraints,
                frequency,
                objective,
                method="differential_evolution",
            )
            results.append(result)

        return results

    def sensitivity_analysis(
        self,
        balance: float,
        interest_rate: float,
        monthly_payment: float,
        constraints: OptimizationConstraints,
        optimal_chunk: float,
        frequency: str = "monthly",
        perturbation: float = 0.1,
    ) -> Dict[str, Dict[str, float]]:
        """Perform sensitivity analysis on optimal solution.

        Args:
            balance: Current mortgage balance
            interest_rate: Annual interest rate
            monthly_payment: Regular monthly payment
            constraints: Optimization constraints
            optimal_chunk: Optimal chunk amount
            frequency: Chunk payment frequency
            perturbation: Percentage to perturb parameters (0.1 = 10%)

        Returns:
            Dictionary of parameter sensitivities
        """
        baseline_months, baseline_interest = self._calculate_payoff_time(
            optimal_chunk, balance, interest_rate, monthly_payment, frequency
        )

        sensitivities = {}

        # Test interest rate sensitivity
        perturbed_rate = interest_rate * (1 + perturbation)
        months, interest = self._calculate_payoff_time(
            optimal_chunk, balance, perturbed_rate, monthly_payment, frequency
        )
        sensitivities["interest_rate"] = {
            "months_change": months - baseline_months,
            "interest_change": interest - baseline_interest,
            "months_pct": ((months - baseline_months) / baseline_months) * 100,
            "interest_pct": ((interest - baseline_interest) / baseline_interest) * 100,
        }

        # Test chunk amount sensitivity
        perturbed_chunk = optimal_chunk * (1 + perturbation)
        months, interest = self._calculate_payoff_time(
            perturbed_chunk, balance, interest_rate, monthly_payment, frequency
        )
        sensitivities["chunk_amount"] = {
            "months_change": months - baseline_months,
            "interest_change": interest - baseline_interest,
            "months_pct": ((months - baseline_months) / baseline_months) * 100,
            "interest_pct": ((interest - baseline_interest) / baseline_interest) * 100,
        }

        # Test monthly payment sensitivity
        perturbed_payment = monthly_payment * (1 + perturbation)
        months, interest = self._calculate_payoff_time(
            optimal_chunk, balance, interest_rate, perturbed_payment, frequency
        )
        sensitivities["monthly_payment"] = {
            "months_change": months - baseline_months,
            "interest_change": interest - baseline_interest,
            "months_pct": ((months - baseline_months) / baseline_months) * 100,
            "interest_pct": ((interest - baseline_interest) / baseline_interest) * 100,
        }

        return sensitivities
