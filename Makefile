.PHONY: format lint

GIT_ROOT ?= $(shell git rev-parse --show-toplevel)

format:
	black .

lint:
	black . --check
	ruff check .

test:
	pytest tests
