IMAGE ?= quay.io/zkorum/agora-description-translation-retry-worker
TAG ?= latest
TAG_ARG := $(or $(word 2,$(MAKECMDGOALS)),$(TAG))
NO_CACHE ?= 0
NO_CACHE_FLAG := $(if $(filter 1,$(NO_CACHE)),--no-cache)

all: dev

dev:
	AGORA_DEV_MODE=true PYTHONUNBUFFERED=1 sh ../../scripts/run-python-worker.sh description_translation_retry_worker.worker

lint:
	uv run --extra dev ruff check

typecheck:
	uv run --extra dev basedpyright

image-buildx:
	docker buildx build --pull $(NO_CACHE_FLAG) --platform linux/amd64 -f Dockerfile -t $(IMAGE):$(TAG_ARG) ../..

image-push:
	docker push $(IMAGE):$(TAG_ARG)

%:
	@:
