all: dev

# templates are used because of 
# https://github.com/OpenAPITools/openapi-generator/pull/16125/files
# https://stackoverflow.com/a/76330785/11046178
# TODO: remove this patch when the PR will be merged
# and change version to latest?
generate:
	docker run --rm \
  -v ${PWD}:/local openapitools/openapi-generator-cli:latest-release generate \
  -i /local/services/api/openapi-zkorum.json \
  -g typescript-axios \
  -o /local/services/agora/src/api

sync:
	cd services/shared && pnpm run sync

dev-sync:
	watchman-make -p 'services/shared/src/**/*.ts' -t sync

dev-generate:
	watchman-make -p 'services/api/openapi-zkorum.json' -t generate

dev-front:
	cd services/agora && pnpm dev 

dev-api:
	cd services/api && pnpm start:dev 
	
