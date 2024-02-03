#!/bin/bash

docker compose -f docker-compose-production.yml up -d
docker exec zkorum_nginx nginx -s reload
