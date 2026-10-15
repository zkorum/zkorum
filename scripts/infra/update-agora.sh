#!/bin/bash

set -euo pipefail

cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

docker compose -f docker-compose-production.yml up -d
docker compose -f docker-compose-production.yml exec -T nginx nginx -t
docker compose -f docker-compose-production.yml exec -T nginx nginx -s reload
