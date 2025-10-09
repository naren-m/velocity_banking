# Scientific Optimization Guide for Velocity Banking

## Overview

This guide explains the scientific optimization approach implemented for finding optimal velocity banking strategies using numerical optimization techniques from scipy.

## Optimization Problem Formulation

### Objective Functions

The system supports three optimization goals:

1. **Minimize Interest** (`optimization_goal: "interest"`)
   - Objective: Minimize total interest paid over the life of the loan
   - Best for: Long-term savings maximization
   - Formula: `minimize total_interest(chunk_amount)`

2. **Minimize Time** (`optimization_goal: "time"`)
   - Objective: Minimize months to loan payoff
   - Best for: Fastest debt elimination
   - Formula: `minimize months_to_payoff(chunk_amount)`

3. **Balanced Optimization** (`optimization_goal: "balanced"`)
   - Objective: Optimize both interest and time with weighted combination
   - Best for: Most users seeking optimal trade-off
   - Formula: `minimize (0.6 * normalized_interest + 0.4 * normalized_time)`

### Constraints

The optimization problem includes several constraints:

```python
Constraints:
- min_chunk ≤ chunk_amount ≤ max_chunk
- chunk_amount ≤ available_LOC × 0.9
- chunk_amount ≤ monthly_cashflow × 6
- chunk_amount ≥ max(1000, monthly_cashflow × 0.5)
- monthly_cashflow = monthly_income - monthly_expenses
```

### Variables

- **Decision Variable**: `chunk_amount` (amount to pay from HELOC each period)
- **Parameters**:
  - `balance`: Current mortgage balance
  - `interest_rate`: Annual interest rate (%)
  - `monthly_payment`: Regular monthly payment
  - `available_loc`: Available line of credit
  - `monthly_income`: Monthly household income
  - `monthly_expenses`: Monthly expenses

## Optimization Methods

### 1. Differential Evolution (Recommended)

**Method**: `differential_evolution`

Global optimization algorithm that explores the entire search space.

**Characteristics**:
- **Pros**: Finds global optimum, robust to local minima
- **Cons**: Slower than local methods
- **Use Case**: Default method for most accurate results
- **Convergence**: Typically 50-200 iterations

**Algorithm**:
```
1. Initialize population of candidate solutions
2. For each generation:
   a. Mutate candidates
   b. Recombine with current population
   c. Select better solutions
3. Return best solution found
```

### 2. Scipy Minimize (L-BFGS-B)

**Method**: `scipy`

Local optimization using Limited-memory BFGS algorithm.

**Characteristics**:
- **Pros**: Fast convergence, efficient
- **Cons**: May find local minima
- **Use Case**: Quick estimates, refinement
- **Convergence**: Typically 10-50 iterations

**Algorithm**:
```
1. Start from initial guess (midpoint of bounds)
2. Compute gradient of objective function
3. Update solution using quasi-Newton method
4. Repeat until convergence
```

### 3. Grid Search

**Method**: `grid_search`

Exhaustive search over discretized parameter space.

**Characteristics**:
- **Pros**: Simple, guaranteed to find optimum in grid
- **Cons**: Limited resolution (50 points)
- **Use Case**: Validation, comparison
- **Convergence**: Fixed (50 evaluations)

**Algorithm**:
```
1. Create grid of 50 evenly-spaced chunk amounts
2. Evaluate objective function at each point
3. Return best solution
```

## API Endpoints

### 1. Optimize Chunk Amount

`POST /api/optimize/chunk`

Find optimal chunk payment amount.

**Request**:
```json
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
```

**Response**:
```json
{
  "optimal_chunk": 12500.50,
  "months_to_payoff": 142,
  "total_interest": 45230.75,
  "interest_saved": 32450.25,
  "monthly_cashflow_impact": 4166.83,
  "confidence_score": 0.87,
  "strategy_type": "moderate",
  "convergence_success": true,
  "constraints": {
    "min_chunk": 1250.00,
    "max_chunk": 15000.00,
    "available_loc": 50000.00
  },
  "method_used": "differential_evolution",
  "optimization_goal": "balanced"
}
```

### 2. Compare Methods

`POST /api/optimize/compare-methods`

Compare all three optimization methods.

**Request**: Same as optimize endpoint (no method parameter needed)

**Response**:
```json
{
  "scipy": {
    "optimal_chunk": 12480.25,
    "months_to_payoff": 143,
    "total_interest": 45350.50,
    "interest_saved": 32330.50,
    "confidence_score": 0.85,
    "strategy_type": "moderate",
    "convergence_success": true
  },
  "differential_evolution": {
    "optimal_chunk": 12500.50,
    "months_to_payoff": 142,
    "total_interest": 45230.75,
    "interest_saved": 32450.25,
    "confidence_score": 0.87,
    "strategy_type": "moderate",
    "convergence_success": true
  },
  "grid_search": {
    "optimal_chunk": 12489.80,
    "months_to_payoff": 142,
    "total_interest": 45245.30,
    "interest_saved": 32435.70,
    "confidence_score": 0.86,
    "strategy_type": "moderate",
    "convergence_success": true
  }
}
```

### 3. Multi-Objective Optimization

`POST /api/optimize/multi-objective`

Get Pareto-optimal solutions for all objectives.

**Request**: Same as optimize endpoint (no optimization_goal parameter needed)

**Response**:
```json
{
  "pareto_optimal_solutions": [
    {
      "optimal_chunk": 15000.00,
      "months_to_payoff": 135,
      "total_interest": 42150.25,
      "interest_saved": 35530.75,
      "monthly_cashflow_impact": 5000.00,
      "confidence_score": 0.75,
      "strategy_type": "aggressive"
    },
    {
      "optimal_chunk": 9800.50,
      "months_to_payoff": 148,
      "total_interest": 46890.30,
      "interest_saved": 30790.70,
      "monthly_cashflow_impact": 3266.83,
      "confidence_score": 0.92,
      "strategy_type": "conservative"
    },
    {
      "optimal_chunk": 12500.50,
      "months_to_payoff": 142,
      "total_interest": 45230.75,
      "interest_saved": 32450.25,
      "monthly_cashflow_impact": 4166.83,
      "confidence_score": 0.87,
      "strategy_type": "moderate"
    }
  ],
  "objectives": ["minimize_interest", "minimize_time", "balanced"]
}
```

### 4. Sensitivity Analysis

`POST /api/optimize/sensitivity`

Analyze how sensitive the optimal solution is to parameter changes.

**Request**:
```json
{
  "balance": 200000,
  "interest_rate": 5.5,
  "monthly_payment": 1500,
  "optimal_chunk": 12500,
  "available_loc": 50000,
  "monthly_income": 7000,
  "monthly_expenses": 4500,
  "frequency": "monthly",
  "perturbation": 0.1
}
```

**Response**:
```json
{
  "sensitivities": {
    "interest_rate": {
      "months_change": 8,
      "interest_change": 5420.50,
      "months_pct": 5.63,
      "interest_pct": 11.98
    },
    "chunk_amount": {
      "months_change": -5,
      "interest_change": -2150.25,
      "months_pct": -3.52,
      "interest_pct": -4.75
    },
    "monthly_payment": {
      "months_change": -12,
      "interest_change": -3890.75,
      "months_pct": -8.45,
      "interest_pct": -8.60
    }
  },
  "perturbation_pct": 10.0,
  "interpretation": {
    "interest_rate": "Impact of interest rate changes on payoff time and interest",
    "chunk_amount": "Impact of chunk amount changes on payoff time and interest",
    "monthly_payment": "Impact of monthly payment changes on payoff time and interest"
  }
}
```

## Strategy Types

The system classifies optimal solutions into three strategy types:

### Conservative
- Chunk amount < 30% of available LOC
- Lower cashflow impact
- Higher confidence scores
- Longer payoff time but safer

### Moderate
- Chunk amount 30-70% of available LOC
- Balanced cashflow impact
- Good confidence scores
- Optimal for most users

### Aggressive
- Chunk amount > 70% of available LOC
- Higher cashflow impact
- May have lower confidence scores
- Fastest payoff but riskier

## Confidence Score

The confidence score (0-1) reflects optimization quality:

```python
Confidence Score Factors:
- Convergence success: Base score 1.0 vs 0.3
- Solution position: -0.2 if at extreme boundaries
- Cashflow safety: -0.3 if chunk > 3 months cashflow
- LOC utilization: -0.1 if > 90% of available LOC
```

**Interpretation**:
- **0.8-1.0**: High confidence, strong recommendation
- **0.6-0.8**: Good confidence, reasonable recommendation
- **0.4-0.6**: Moderate confidence, use with caution
- **0.0-0.4**: Low confidence, reconsider parameters

## Usage Examples

### Example 1: Conservative Strategy

```bash
curl -X POST http://localhost:3001/api/optimize/chunk \
  -H "Content-Type: application/json" \
  -d '{
    "balance": 250000,
    "interest_rate": 6.0,
    "monthly_payment": 1800,
    "available_loc": 60000,
    "monthly_income": 8000,
    "monthly_expenses": 5500,
    "optimization_goal": "balanced",
    "method": "differential_evolution"
  }'
```

### Example 2: Aggressive Time Optimization

```bash
curl -X POST http://localhost:3001/api/optimize/chunk \
  -H "Content-Type: application/json" \
  -d '{
    "balance": 180000,
    "interest_rate": 5.5,
    "monthly_payment": 1400,
    "available_loc": 80000,
    "monthly_income": 10000,
    "monthly_expenses": 6000,
    "optimization_goal": "time",
    "method": "differential_evolution"
  }'
```

### Example 3: Interest Minimization

```bash
curl -X POST http://localhost:3001/api/optimize/chunk \
  -H "Content-Type: application/json" \
  -d '{
    "balance": 300000,
    "interest_rate": 7.0,
    "monthly_payment": 2200,
    "available_loc": 100000,
    "monthly_income": 12000,
    "monthly_expenses": 7000,
    "optimization_goal": "interest",
    "method": "differential_evolution"
  }'
```

## Best Practices

1. **Use differential_evolution** for most accurate results
2. **Compare methods** to validate optimization results
3. **Check confidence score** before implementing strategy
4. **Run sensitivity analysis** to understand parameter impact
5. **Use multi-objective** to see trade-offs between goals
6. **Consider cashflow impact** - ensure sustainable repayment

## Mathematical Background

### Amortization Formula

Monthly interest paid:
```
I_t = B_t * (r / 12)
```

Where:
- `I_t` = Interest paid in month t
- `B_t` = Balance at month t
- `r` = Annual interest rate (as decimal)

Principal paid:
```
P_t = M - I_t
```

Where:
- `M` = Monthly payment

### Velocity Banking Extension

With chunk payments:
```
B_{t+1} = B_t - P_t - C_t

Where:
C_t = {
  chunk_amount  if t mod frequency == 0
  0             otherwise
}
```

### Optimization Objective

Balanced objective function:
```
f(chunk) = 0.6 * (total_interest / balance) + 0.4 * (months / 360)
```

Subject to constraints:
```
min_chunk ≤ chunk ≤ max_chunk
chunk ≤ 0.9 * available_LOC
chunk ≤ 6 * monthly_cashflow
```

## Performance

- **Differential Evolution**: ~100-500ms per optimization
- **Scipy Minimize**: ~50-200ms per optimization
- **Grid Search**: ~200-400ms per optimization
- **Compare Methods**: ~500-1000ms (all three methods)
- **Multi-Objective**: ~300-600ms (three objectives)
- **Sensitivity Analysis**: ~150-300ms (three parameters)

## Limitations

1. **Assumes constant interest rate** - does not account for rate changes
2. **Simplified HELOC model** - assumes interest-only payments
3. **No tax considerations** - interest deductibility not included
4. **Fixed monthly payment** - does not optimize payment amount
5. **Deterministic** - no stochastic variations

## Future Enhancements

- [ ] Monte Carlo simulation for uncertainty quantification
- [ ] Dynamic programming for variable interest rates
- [ ] Tax-adjusted optimization
- [ ] Multi-period HELOC repayment modeling
- [ ] Risk-adjusted optimization with Value at Risk (VaR)
- [ ] Machine learning for parameter prediction
