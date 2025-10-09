.PHONY: help install test run clean lint format

help:
	@echo "Available commands:"
	@echo "  make install    - Install dependencies"
	@echo "  make test       - Run tests"
	@echo "  make test-cov   - Run tests with coverage"
	@echo "  make run        - Run development server"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make lint       - Run linters"
	@echo "  make format     - Format code"
	@echo "  make docker     - Build Docker image"

install:
	pip install -r requirements.txt

test:
	pytest

test-cov:
	pytest --cov=src --cov-report=html --cov-report=term

run:
	uvicorn src.main:app --reload --port 3001

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf build/ dist/ .pytest_cache/ htmlcov/ .coverage

lint:
	flake8 src/
	mypy src/

format:
	black src/

docker:
	docker build -t velocity-banking-backend-python .

docker-run:
	docker run -p 3001:3001 -v $(PWD)/data:/app/data velocity-banking-backend-python
