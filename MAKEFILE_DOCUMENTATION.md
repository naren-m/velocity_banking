# Makefile Documentation

**Project**: Velocity Banking
**Purpose**: DevOps automation for testing, building, and deployment
**Author**: DevOps Team
**Last Updated**: October 3, 2025

---

## Quick Start

```bash
# Show all available commands
make help

# Run all tests
make test

# Start development environment
make dev

# View service logs
make logs
```

---

## Testing Commands

### `make test`
**Description**: Run all tests (quick validation + comprehensive suite)
**Duration**: ~15 seconds
**Tests**: 28 total (3 quick + 25 comprehensive)
**Requirements**: Docker containers must be running

**Output**:
- Quick validation results (3 tests)
- Comprehensive test suite results (25 tests)
- Final success/failure summary

**Example**:
```bash
make test
```

**Success Output**:
```
✓ Balance Calculation: PASS
✓ Pays off faster: PASS
✓ Net savings positive: PASS
...
✅ All tests completed successfully!
```

---

### `make test-quick`
**Description**: Run quick validation tests only
**Duration**: ~5 seconds
**Tests**: 3 critical validations

**What it tests**:
1. Interest calculation on beginning balance
2. Savings verification (time + money saved)
3. HELOC paydown logic

**Use case**: Fast feedback during development

**Example**:
```bash
make test-quick
```

---

### `make test-comprehensive`
**Description**: Run comprehensive test suite
**Duration**: ~10 seconds
**Tests**: 25 detailed validations

**Test Suites**:
1. Amortization Formula Accuracy (4 tests)
2. Interest Accrual Timing (2 tests)
3. HELOC Interest Accumulation (2 tests)
4. Edge Cases (3 tests)
5. Optimal Strategy Calculations (10 tests)
6. Compound Interest Validation (2 tests)

**Use case**: Pre-commit validation, CI/CD pipeline

**Example**:
```bash
make test-comprehensive
```

---

### `make test-watch`
**Description**: Run tests in watch mode (continuous)
**Duration**: Infinite (Ctrl+C to exit)
**Refresh**: Every 5 seconds

**Use case**: Real-time feedback during development

**Example**:
```bash
make test-watch
# Press Ctrl+C to exit
```

---

## Build Commands

### `make build`
**Description**: Build all Docker containers
**Duration**: ~30-60 seconds (first build), ~5-10 seconds (cached)
**Containers**: backend, frontend

**Process**:
1. Builds backend container with Node.js dependencies
2. Builds frontend container with React + Vite
3. Compiles TypeScript
4. Creates production-ready images

**Example**:
```bash
make build
```

---

### `make build-backend`
**Description**: Build backend container only
**Duration**: ~20-30 seconds

**Example**:
```bash
make build-backend
```

---

### `make build-frontend`
**Description**: Build frontend container only
**Duration**: ~20-30 seconds

**Example**:
```bash
make build-frontend
```

---

## Development Commands

### `make dev`
**Description**: Start complete development environment
**Duration**: ~40-60 seconds

**Process**:
1. Builds all containers
2. Starts all services
3. Waits for services to be ready
4. Shows access URLs

**Services Started**:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

**Example**:
```bash
make dev
```

**Output**:
```
✅ Development environment is ready!

🔗 Frontend: http://localhost:5173
🔗 Backend:  http://localhost:3001

Run 'make logs' to view service logs
Run 'make test' to run tests
```

---

### `make up`
**Description**: Start all services (without rebuilding)
**Duration**: ~5-10 seconds

**Use case**: Restart services after they've been stopped

**Example**:
```bash
make up
```

---

### `make down`
**Description**: Stop all services
**Duration**: ~5 seconds

**Example**:
```bash
make down
```

---

### `make restart`
**Description**: Restart all running services
**Duration**: ~10 seconds

**Use case**: Apply configuration changes without rebuilding

**Example**:
```bash
make restart
```

---

### `make clean`
**Description**: Clean up containers, volumes, and orphaned images
**Duration**: ~10-15 seconds
**Warning**: **DESTRUCTIVE** - Requires confirmation

**What it removes**:
- All containers
- All volumes (including database)
- Orphaned images

**Example**:
```bash
make clean
# Prompts: "Are you sure? [y/N]"
```

---

## Utility Commands

### `make logs`
**Description**: View logs from all services in real-time
**Duration**: Continuous (Ctrl+C to exit)

**Example**:
```bash
make logs
```

---

### `make logs-backend`
**Description**: View backend logs only

**Example**:
```bash
make logs-backend
```

---

### `make logs-frontend`
**Description**: View frontend logs only

**Example**:
```bash
make logs-frontend
```

---

### `make shell-backend`
**Description**: Open interactive shell in backend container

**Use case**: Debugging, manual testing, database access

**Example**:
```bash
make shell-backend
# Opens Alpine Linux shell
```

**Common commands inside shell**:
```bash
# View files
ls -la

# Run tests manually
node dist/scripts/validateCalculations.js

# Access database
sqlite3 /app/data/velocity-banking.db
```

---

### `make shell-frontend`
**Description**: Open interactive shell in frontend container

**Example**:
```bash
make shell-frontend
```

---

## Quality Commands

### `make lint`
**Description**: Run code linters

**Linters**:
- ESLint (if configured)
- TypeScript compiler checks

**Example**:
```bash
make lint
```

---

### `make format`
**Description**: Format code using Prettier (if configured)

**Example**:
```bash
make format
```

---

### `make validate`
**Description**: Run all validation checks (tests + linting)
**Duration**: ~20 seconds

**Checks**:
1. All tests (quick + comprehensive)
2. Linting
3. Code formatting

**Use case**: Pre-commit hook, CI/CD gate

**Example**:
```bash
make validate
```

---

## Database Commands

### `make db-shell`
**Description**: Open SQLite shell for database access

**Example**:
```bash
make db-shell
# Opens sqlite3 prompt
```

**Common SQL commands**:
```sql
-- List tables
.tables

-- View mortgages
SELECT * FROM mortgages;

-- View users
SELECT * FROM users;

-- Exit
.quit
```

---

### `make db-backup`
**Description**: Create timestamped database backup
**Location**: `/app/data/velocity-banking-backup-YYYYMMDD-HHMMSS.db`

**Example**:
```bash
make db-backup
```

**Output**:
```
Creating database backup...
✅ Backup created!
```

---

### `make db-reset`
**Description**: Reset database (delete all data)
**Warning**: **DESTRUCTIVE** - Requires confirmation

**Example**:
```bash
make db-reset
# Prompts: "⚠️  This will DELETE ALL DATA from the database"
# Prompts: "Are you sure? [y/N]"
```

---

## CI/CD Integration

### `make ci`
**Description**: Full CI pipeline (build + start + test)
**Duration**: ~60-90 seconds

**Process**:
1. Build all containers
2. Start all services
3. Run all tests
4. Report results

**Use case**: Continuous Integration pipeline

**Example**:
```bash
make ci
```

---

### `make pre-commit`
**Description**: Pre-commit checks (lint + quick tests)
**Duration**: ~10 seconds

**Use case**: Git pre-commit hook

**Example**:
```bash
make pre-commit
```

---

### `make pre-push`
**Description**: Pre-push validation (all checks)
**Duration**: ~20 seconds

**Use case**: Git pre-push hook

**Example**:
```bash
make pre-push
```

---

## Health & Status Commands

### `make health`
**Description**: Check service health status

**Example**:
```bash
make health
```

**Output**:
```
Backend Health:
 ✅
Frontend Health:
✅ Frontend is running
```

---

### `make status`
**Description**: Show container status

**Example**:
```bash
make status
```

**Output**:
```
NAME                              STATUS    PORTS
velocity-banking-backend          Up        0.0.0.0:3001->3001/tcp
velocity-banking-frontend         Up        0.0.0.0:5173->5173/tcp
```

---

## Documentation Commands

### `make docs-test`
**Description**: View testing summary documentation

**Example**:
```bash
make docs-test
```

---

### `make docs-coverage`
**Description**: View detailed test coverage report

**Example**:
```bash
make docs-coverage
```

---

## Advanced Commands

### `make test-file`
**Description**: Run specific test file
**Interactive**: Prompts for file path

**Example**:
```bash
make test-file
# Enter test file path: src/services/__tests__/helocVelocityService.test.ts
```

---

### `make benchmark`
**Description**: Run performance benchmarks

**Example**:
```bash
make benchmark
```

---

### `make security-scan`
**Description**: Run npm security audit

**Example**:
```bash
make security-scan
```

---

## Common Workflows

### Daily Development
```bash
# Morning startup
make dev

# Run tests after changes
make test-quick

# View logs if issues
make logs-backend

# End of day
make down
```

---

### Before Committing Code
```bash
# Run pre-commit checks
make pre-commit

# If tests pass, commit
git add .
git commit -m "Your message"
```

---

### Debugging Issues
```bash
# Check service status
make status

# View logs
make logs

# Open shell for investigation
make shell-backend

# Reset if needed
make clean
make dev
```

---

### Database Operations
```bash
# Backup before changes
make db-backup

# Make changes via shell
make shell-backend

# Reset if needed
make db-reset
```

---

## Troubleshooting

### Tests Failing
```bash
# 1. Check if services are running
make status

# 2. Restart services
make restart

# 3. View logs for errors
make logs-backend

# 4. Rebuild if needed
make build
make up
```

---

### Containers Not Starting
```bash
# 1. Stop everything
make down

# 2. Clean up
make clean

# 3. Rebuild from scratch
make dev
```

---

### Database Issues
```bash
# 1. Backup current data
make db-backup

# 2. Reset database
make db-reset

# 3. Restart services
make restart
```

---

## Environment Requirements

- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Make**: GNU Make 4.0+
- **Operating System**: macOS, Linux, or Windows (with WSL2)

---

## Project Structure

```
velocity_banking/
├── Makefile                          # This file
├── docker-compose.yml                # Docker orchestration
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── scripts/
│   │   │   ├── validateCalculations.ts
│   │   │   └── comprehensiveInterestTests.ts
│   │   └── services/
│   ├── TESTING_SUMMARY.md
│   └── TEST_COVERAGE_REPORT.md
└── frontend/
    ├── Dockerfile
    └── package.json
```

---

## Support

For issues or questions:
1. Check logs: `make logs`
2. Run health check: `make health`
3. Review test output: `make test`
4. Consult documentation: `make docs-test`

---

## Version History

**v1.0.0** - October 3, 2025
- Initial Makefile creation
- Testing automation
- Development workflow
- CI/CD integration
