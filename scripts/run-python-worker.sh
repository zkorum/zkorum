#!/bin/sh

set -eu

if [ "$#" -eq 0 ]; then
  echo "Usage: $0 <module> [arguments...]" >&2
  exit 2
fi

# gRPC's bundled roots are independent of certifi and can retain compromised CAs.
if [ -z "${GRPC_DEFAULT_SSL_ROOTS_FILE_PATH:-}" ]; then
  GRPC_DEFAULT_SSL_ROOTS_FILE_PATH=$(uv run python -c 'import certifi; print(certifi.where())')
fi
export GRPC_DEFAULT_SSL_ROOTS_FILE_PATH

exec uv run python -m "$@"
