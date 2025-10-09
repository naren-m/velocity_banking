# Velocity Banking System

A simple and clean web application to help users optimize their mortgage payoff using velocity banking strategies.

## Features

- **Mortgage Management**: Track your mortgage details and current balance
- **Velocity Banking Calculator**: Compare standard payoff vs. velocity banking scenarios
- **Payment Processing**: Make regular, chunk, or extra payments
- **Savings Analytics**: Visualize interest savings and time reduction
- **Clean UI**: Simple, intuitive interface built with React and Tailwind CSS

## Technology Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Recharts for data visualization
- Zustand for state management
- React Router for navigation

### Backend
- Python with Flask
- SQLAlchemy ORM
- SQLite database
- Pydantic for validation

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Make (GNU Make 4.0+)

### Development Setup

**Using Make (Recommended)**:
```bash
# Start development environment
make dev

# Run all tests
make test

# View all available commands
make help
```

**Manual Setup**:
```bash
# Build and start containers
docker compose up -d

# Run tests
docker compose exec backend node dist/scripts/comprehensiveInterestTests.js
```

### Services
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

### Testing
```bash
make test              # All tests (28 tests, ~15s)
make test-quick        # Quick validation (3 tests, ~5s)
make test-comprehensive # Full suite (25 tests, ~10s)
```

See [Quick Reference](QUICK_REFERENCE.md) for all available commands.

## Project Structure

```
velocity-banking/
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── services/      # API client
│   │   ├── stores/        # State management
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   └── package.json
├── backend_python/        # Flask backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── services/      # Business logic
│   │   ├── models/        # Database models
│   │   └── middleware/    # Flask middleware
│   └── requirements.txt
└── package.json           # Root workspace config
```

## API Endpoints

### Mortgages
- `POST /api/mortgages` - Create new mortgage
- `GET /api/mortgages/:id` - Get mortgage details
- `PUT /api/mortgages/:id` - Update mortgage
- `DELETE /api/mortgages/:id` - Delete mortgage
- `GET /api/mortgages/:id/amortization` - Get amortization schedule

### Calculations
- `POST /api/calculate/velocity` - Calculate velocity scenario
- `POST /api/calculate/optimal-chunk` - Get optimal chunk amount
- `POST /api/calculate/compare` - Compare scenarios

### HELOC Strategy
- `POST /api/helocs` - Create HELOC
- `GET /api/helocs/mortgage/:mortgageId` - Get HELOC by mortgage
- `PUT /api/helocs/:id` - Update HELOC
- `POST /api/helocs/calculate-strategy` - Calculate strategy for specific chunk amount
- `POST /api/helocs/calculate-optimal-strategies` - Get optimal strategies for multiple target years
- `POST /api/helocs/calculate-strategies-for-target` - Get multiple chunk strategies for single target year

### Payments
- `POST /api/payments` - Make a payment
- `GET /api/payments/mortgage/:mortgageId` - Get payment history
- `GET /api/payments/:id` - Get payment details
- `GET /api/payments/mortgage/:mortgageId/totals` - Get payment totals

## Usage

1. **Create a Mortgage**: Enter your mortgage details (principal, interest rate, monthly payment, term)
2. **View Dashboard**: See your current balance, payment info, and recent transactions
3. **Calculate Scenarios**: Use the calculator to compare standard vs. velocity banking payoff
4. **Make Payments**: Process regular monthly payments or chunk payments from your LOC
5. **Track Savings**: Monitor your interest savings and accelerated payoff timeline

## Velocity Banking Concept

Velocity banking is a debt payoff strategy that uses a line of credit (LOC) to make lump sum payments toward your mortgage principal. By strategically moving income through the LOC and making chunk payments, you can:

- Reduce the principal balance faster
- Pay less interest over the life of the loan
- Shorten your payoff timeline significantly

This calculator helps you visualize the impact of different chunk payment amounts and frequencies.

## Documentation

- **[Quick Reference](QUICK_REFERENCE.md)** - Command cheat sheet
- **[Implementation Plan](IMPLEMENTATION_PLAN.md)** - Complete project roadmap
- **[Project Status](PROJECT_STATUS.md)** - Current status dashboard
- **[Makefile Docs](MAKEFILE_DOCUMENTATION.md)** - Full command reference
- **[Testing Summary](backend_python/TESTING_SUMMARY.md)** - Test execution guide
- **[DevOps Setup](DEVOPS_SETUP_COMPLETE.md)** - DevOps automation guide

## Project Status

**Current Phase**: ✅ Production Ready

- ✅ Core features: 100% complete
- ✅ Test coverage: 100% (28/28 tests passing)
- ✅ DevOps automation: 30+ make commands
- ✅ Mathematical accuracy: Verified
- ✅ Documentation: Comprehensive

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for details.

## License

MIT
