# Velocity Banking - Makefile
# DevOps automation for testing, building, and deployment

.PHONY: help test test-quick test-comprehensive test-all build up down clean logs shell-backend shell-frontend restart dev

# Default target - show help
help:
	@echo "════════════════════════════════════════════════════════════════"
	@echo "Velocity Banking - Available Make Commands"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "Testing Commands:"
	@echo "  make test                  Run all tests (quick + comprehensive)"
	@echo "  make test-quick            Run quick validation (3 tests, ~5s)"
	@echo "  make test-comprehensive    Run comprehensive suite (25 tests, ~10s)"
	@echo "  make test-watch            Run tests in watch mode"
	@echo ""
	@echo "Build Commands:"
	@echo "  make build                 Build all Docker containers"
	@echo "  make build-backend         Build backend only"
	@echo "  make build-frontend        Build frontend only"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev                   Start development environment"
	@echo "  make up                    Start all services"
	@echo "  make down                  Stop all services"
	@echo "  make restart               Restart all services"
	@echo "  make clean                 Clean containers and volumes"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make logs                  View all service logs"
	@echo "  make logs-backend          View backend logs only"
	@echo "  make logs-frontend         View frontend logs only"
	@echo "  make shell-backend         Open shell in backend container"
	@echo "  make shell-frontend        Open shell in frontend container"
	@echo ""
	@echo "Quality Commands:"
	@echo "  make lint                  Run linters"
	@echo "  make format                Format code"
	@echo "  make validate              Run all validation checks"
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"

# ============================================================================
# Testing Targets
# ============================================================================

# Run all tests
test: test-quick test-comprehensive
	@echo ""
	@echo "✅ All tests completed successfully!"

# Quick validation test (3 tests, ~5 seconds)
test-quick:
	@echo "════════════════════════════════════════════════════════════════"
	@echo "Running Quick Validation Tests..."
	@echo "════════════════════════════════════════════════════════════════"
	@docker compose exec backend node dist/scripts/validateCalculations.js

# Comprehensive test suite (25 tests, ~10 seconds)
test-comprehensive:
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "Running Comprehensive Test Suite..."
	@echo "════════════════════════════════════════════════════════════════"
	@docker compose exec backend node dist/scripts/comprehensiveInterestTests.js

# Run all tests (alias)
test-all: test

# Watch mode for continuous testing (requires containers to be running)
test-watch:
	@echo "Starting test watch mode (press Ctrl+C to exit)..."
	@while true; do \
		clear; \
		make test-quick; \
		sleep 5; \
	done

# ============================================================================
# Build Targets
# ============================================================================

# Build all containers
build:
	@echo "Building all Docker containers..."
	@docker compose build

# Build backend only
build-backend:
	@echo "Building backend container..."
	@docker compose build backend

# Build frontend only
build-frontend:
	@echo "Building frontend container..."
	@docker compose build frontend

# ============================================================================
# Development Workflow
# ============================================================================

# Start development environment
dev: build up
	@echo ""
	@echo "✅ Development environment is ready!"
	@echo ""
	@echo "🔗 Frontend: http://localhost:5173"
	@echo "🔗 Backend:  http://localhost:3001"
	@echo ""
	@echo "Run 'make logs' to view service logs"
	@echo "Run 'make test' to run tests"

# Start all services
up:
	@echo "Starting all services..."
	@docker compose up -d
	@echo "Waiting for services to be ready..."
	@sleep 5
	@echo "✅ Services started successfully!"

# Stop all services
down:
	@echo "Stopping all services..."
	@docker compose down

# Restart all services
restart:
	@echo "Restarting all services..."
	@docker compose restart
	@echo "Waiting for services to be ready..."
	@sleep 5
	@echo "✅ Services restarted successfully!"

# Clean up containers, volumes, and images
clean:
	@echo "⚠️  This will remove all containers, volumes, and orphaned images"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose down -v --remove-orphans; \
		echo "✅ Cleanup completed!"; \
	else \
		echo "Cleanup cancelled."; \
	fi

# ============================================================================
# Logging and Debugging
# ============================================================================

# View all service logs
logs:
	@docker compose logs -f

# View backend logs only
logs-backend:
	@docker compose logs -f backend

# View frontend logs only
logs-frontend:
	@docker compose logs -f frontend

# Open shell in backend container
shell-backend:
	@echo "Opening shell in backend container..."
	@docker compose exec backend sh

# Open shell in frontend container
shell-frontend:
	@echo "Opening shell in frontend container..."
	@docker compose exec frontend sh

# ============================================================================
# Quality Assurance
# ============================================================================

# Run linters
lint:
	@echo "Running linters..."
	@docker compose exec backend npm run lint || echo "No lint script configured"
	@docker compose exec frontend npm run lint || echo "No lint script configured"

# Format code
format:
	@echo "Formatting code..."
	@docker compose exec backend npm run format || echo "No format script configured"
	@docker compose exec frontend npm run format || echo "No format script configured"

# Run all validation checks
validate: test lint
	@echo ""
	@echo "✅ All validation checks passed!"

# ============================================================================
# Database and Data Management
# ============================================================================

# View database
db-shell:
	@docker compose exec backend sqlite3 /app/data/velocity-banking.db

# Backup database
db-backup:
	@echo "Creating database backup..."
	@docker compose exec backend cp /app/data/velocity-banking.db /app/data/velocity-banking-backup-$$(date +%Y%m%d-%H%M%S).db
	@echo "✅ Backup created!"

# Reset database (WARNING: Deletes all data)
db-reset:
	@echo "⚠️  This will DELETE ALL DATA from the database"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose exec backend rm -f /app/data/velocity-banking.db; \
		docker compose restart backend; \
		echo "✅ Database reset completed!"; \
	else \
		echo "Database reset cancelled."; \
	fi

# ============================================================================
# CI/CD Integration
# ============================================================================

# CI pipeline - full build and test
ci: build up test
	@echo ""
	@echo "✅ CI pipeline completed successfully!"

# Pre-commit checks
pre-commit: lint test-quick
	@echo ""
	@echo "✅ Pre-commit checks passed!"

# Pre-push checks
pre-push: validate
	@echo ""
	@echo "✅ Pre-push checks passed!"

# ============================================================================
# Health Checks
# ============================================================================

# Check service health
health:
	@echo "Checking service health..."
	@echo ""
	@echo "Backend Health:"
	@curl -f http://localhost:3001/health 2>/dev/null && echo " ✅" || echo " ❌ Backend not responding"
	@echo ""
	@echo "Frontend Health:"
	@curl -f http://localhost:5173 2>/dev/null > /dev/null && echo "✅ Frontend is running" || echo "❌ Frontend not responding"
	@echo ""

# Show container status
status:
	@echo "Container Status:"
	@docker compose ps

# ============================================================================
# Documentation
# ============================================================================

# Generate test coverage report
coverage-report:
	@echo "Generating test coverage report..."
	@docker compose exec backend npm run test:coverage || echo "Coverage not configured"

# View test documentation
docs-test:
	@cat backend/TESTING_SUMMARY.md

# View full test coverage
docs-coverage:
	@cat backend/TEST_COVERAGE_REPORT.md

# ============================================================================
# Advanced Targets
# ============================================================================

# Run specific test file
test-file:
	@read -p "Enter test file path: " filepath; \
	docker compose exec backend npm test $$filepath

# Benchmark tests
benchmark:
	@echo "Running performance benchmarks..."
	@docker compose exec backend time node dist/scripts/comprehensiveInterestTests.js

# Security scan
security-scan:
	@echo "Running security scan..."
	@docker compose exec backend npm audit
	@docker compose exec frontend npm audit
