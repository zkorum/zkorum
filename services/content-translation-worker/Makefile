IMAGE ?= quay.io/zkorum/agora-content-translation-worker
TAG ?= latest
TAG_ARG := $(or $(word 2,$(MAKECMDGOALS)),$(TAG))
NO_CACHE ?= 0
NO_CACHE_FLAG := $(if $(filter 1,$(NO_CACHE)),--no-cache)

all: dev

dev:
	PYTHONUNBUFFERED=1 sh ../../scripts/run-python-worker.sh content_translation_worker.worker

lint:
	uv run --extra dev ruff check .

typecheck:
	uv run --extra dev basedpyright

test:
	uv run --extra dev python -m pytest

image-buildx:
	docker buildx build --pull $(NO_CACHE_FLAG) --platform linux/amd64 -f Dockerfile -t $(IMAGE):$(TAG_ARG) ../..

image-push:
	docker push $(IMAGE):$(TAG_ARG)

%:
	@:
