IMAGE ?= quay.io/zkorum/agora-import-worker
TAG ?= latest
TAG_ARG := $(or $(word 2,$(MAKECMDGOALS)),$(TAG))
NO_CACHE ?= 0
NO_CACHE_FLAG := $(if $(filter 1,$(NO_CACHE)),--no-cache)

all: dev

dev:
	uv run python -m import_worker.worker

test:
	uv run --extra dev pytest -v

lint:
	uv run --extra dev ruff check

typecheck:
	uv run --extra dev basedpyright

image-buildx:
	docker buildx build --network=host --pull $(NO_CACHE_FLAG) --platform linux/amd64 -f Dockerfile -t $(IMAGE):$(TAG_ARG) ../..

image-push:
	docker push $(IMAGE):$(TAG_ARG)

%:
	@:
