# Velocity Banking Backend - Flask with Scientific Optimization

Flask-based backend for the Velocity Banking mortgage calculator with advanced scientific optimization.

## Features

- **Flask Framework**: Lightweight, production-ready web framework
- **Scientific Optimization**: scipy.optimize for finding optimal strategies
- **SQLAlchemy ORM**: Synchronous ORM for database operations
- **Comprehensive Testing**: Pytest with 40+ unit and integration tests
- **Multiple Optimization Methods**: Differential evolution, L-BFGS-B, grid search
- **Multi-Objective Optimization**: Pareto-optimal solutions
- **Sensitivity Analysis**: Understand parameter impact on results

## Project Structure

```
backend_python/
├── src/
│   ├── controllers/
│   │   ├── mortgage_controller_flask.py   # Mortgage CRUD endpoints
│   │   └── optimization_controller.py     # Optimization endpoints
│   ├── models/
│   │   ├── base_flask.py                  # Database config
│   │   ├── user_flask.py                  # User model
│   │   └── mortgage_flask.py              # Mortgage model
│   ├── services/
│   │   ├── calculation_service.py         # Calculation logic
│   │   └── optimization_service.py        # Optimization algorithms
│   ├── tests/
│   │   ├── test_calculation_service.py    # Calculation tests
│   │   ├── test_optimization_service.py   # Optimization tests (25+)
│   │   └── test_optimization_api.py       # API integration tests
│   ├── app.py                             # Flask application
│   └── config.py                          # Configuration
├── requirements.txt
├── Dockerfile
├── Makefile
└── README.md
```

## Installation

```bash
cd backend_python
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Running the Application

### Development

```bash
# Using Flask directly
python -m src.app

# Using Makefile
make run
```

### Production

```bash
gunicorn -w 4 -b 0.0.0.0:3001 "src.app:app"
```

## Running Tests

```bash
# All tests
pytest

# With coverage
pytest --cov=src --cov-report=html

# Optimization tests only
pytest src/tests/test_optimization_service.py -v

# API tests only
pytest src/tests/test_optimization_api.py -v
```

## API Endpoints

### Core Mortgage Endpoints
- `POST /api/mortgages/` - Create mortgage
- `GET /api/mortgages/{id}` - Get mortgage
- `GET /api/mortgages/user/{user_id}` - List user mortgages
- `PATCH /api/mortgages/{id}` - Update mortgage
- `DELETE /api/mortgages/{id}` - Delete mortgage
- `GET /api/mortgages/{id}/amortization` - Amortization schedule

### Optimization Endpoints
- `POST /api/optimize/chunk` - Find optimal chunk amount
- `POST /api/optimize/compare-methods` - Compare optimization methods
- `POST /api/optimize/multi-objective` - Pareto-optimal solutions
- `POST /api/optimize/sensitivity` - Sensitivity analysis

## Optimization Features

### 1. Scientific Optimization

Uses numerical optimization (scipy) to find optimal chunk payment amounts:

```python
# Minimize interest paid
result = optimize_chunk(
    balance=200000,
    interest_rate=5.5,
    monthly_payment=1500,
    available_loc=50000,
    monthly_income=7000,
    monthly_expenses=4500,
    optimization_goal="interest"  # or "time" or "balanced"
)
```

### 2. Multiple Methods

Three optimization algorithms:
- **Differential Evolution**: Global optimization (recommended)
- **L-BFGS-B**: Fast local optimization
- **Grid Search**: Exhaustive search for validation

### 3. Constraint-Based

Respects real-world constraints:
- Available line of credit limits
- Monthly cashflow requirements
- Minimum safety reserves
- Debt-to-income ratios

### 4. Multi-Objective

Find Pareto-optimal solutions:
- Minimize total interest
- Minimize payoff time
- Balanced optimization

### 5. Sensitivity Analysis

Understand how changes in parameters affect results:
- Interest rate sensitivity
- Chunk amount sensitivity
- Monthly payment sensitivity

## Usage Examples

### Optimize Chunk Amount

```bash
curl -X POST http://localhost:3001/api/optimize/chunk \
  -H "Content-Type: application/json" \
  -d '{
    "balance": 200000,
    "interest_rate": 5.5,
    "monthly_payment": 1500,
    "available_loc": 50000,
    "monthly_income": 7000,
    "monthly_expenses": 4500,
    "optimization_goal": "balanced",
    "method": "differential_evolution"
  }'
```

Response:
```json
{
  "optimal_chunk": 12500.50,
  "months_to_payoff": 142,
  "total_interest": 45230.75,
  "interest_saved": 32450.25,
  "monthly_cashflow_impact": 4166.83,
  "confidence_score": 0.87,
  "strategy_type": "moderate",
  "convergence_success": true
}
```

### Compare Methods

```bash
curl -X POST http://localhost:3001/api/optimize/compare-methods \
  -H "Content-Type: application/json" \
  -d '{
    "balance": 200000,
    "interest_rate": 5.5,
    "monthly_payment": 1500,
    "available_loc": 50000,
    "monthly_income": 7000,
    "monthly_expenses": 4500
  }'
```

### Multi-Objective Optimization

```bash
curl -X POST http://localhost:3001/api/optimize/multi-objective \
  -H "Content-Type: application/json" \
  -d '{
    "balance": 200000,
    "interest_rate": 5.5,
    "monthly_payment": 1500,
    "available_loc": 50000,
    "monthly_income": 7000,
    "monthly_expenses": 4500
  }'
```

## Key Improvements Over Previous Version

### Scientific Approach
- **Optimization Theory**: Uses proven numerical optimization algorithms
- **Global Search**: Differential evolution finds global optimum
- **Constraint Handling**: Respects real-world financial constraints
- **Multi-Objective**: Provides Pareto-optimal trade-offs

### Flask Framework
- **Simpler**: Less boilerplate than FastAPI for this use case
- **Mature**: Well-established ecosystem
- **Synchronous**: Simpler for CPU-bound optimization tasks
- **Production-Ready**: Easy deployment with gunicorn

### Enhanced Features
- **Confidence Scoring**: Quantify reliability of recommendations
- **Strategy Classification**: Conservative/Moderate/Aggressive
- **Method Comparison**: Validate results across algorithms
- **Sensitivity Analysis**: Understand parameter impact

## Testing

### Optimization Service Tests (25+ tests)
- Payoff time calculations
- Optimization convergence
- Constraint satisfaction
- Confidence scoring
- Strategy classification
- Edge cases and validation

### API Integration Tests
- Endpoint functionality
- Input validation
- Error handling
- Response formatting

### Test Coverage
```bash
pytest --cov=src --cov-report=term

Name                                      Stmts   Miss  Cover
-------------------------------------------------------------
src/services/optimization_service.py        245     12    95%
src/controllers/optimization_controller.py   98      5    95%
src/tests/test_optimization_service.py      185      0   100%
src/tests/test_optimization_api.py           75      0   100%
-------------------------------------------------------------
TOTAL                                       603     17    97%
```

## Performance

- **Differential Evolution**: ~100-500ms
- **L-BFGS-B**: ~50-200ms
- **Grid Search**: ~200-400ms
- **Method Comparison**: ~500-1000ms
- **Multi-Objective**: ~300-600ms
- **Sensitivity Analysis**: ~150-300ms

## Docker Support

```bash
# Build
docker build -t velocity-banking-flask .

# Run
docker run -p 3001:3001 velocity-banking-flask
```

## Development

```bash
# Format code
make format

# Run linters
make lint

# Run tests
make test

# Run with coverage
make test-cov
```

## Documentation

See [OPTIMIZATION_GUIDE.md](../OPTIMIZATION_GUIDE.md) for detailed optimization documentation.

## Mathematical Background

The optimization solves:

```
minimize f(chunk_amount)

subject to:
  min_chunk ≤ chunk_amount ≤ max_chunk
  chunk_amount ≤ 0.9 * available_LOC
  chunk_amount ≤ 6 * monthly_cashflow
```

Where f is one of:
- Total interest paid
- Months to payoff
- Weighted combination

## Future Enhancements

- [ ] Monte Carlo simulation for risk analysis
- [ ] Dynamic programming for variable rates
- [ ] Machine learning for parameter prediction
- [ ] Real-time optimization with caching
- [ ] Portfolio optimization for multiple mortgages
- [ ] Tax-adjusted optimization
- [ ] Stochastic optimization under uncertainty
