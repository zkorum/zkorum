all: dev

# templates are used because of 
# https://github.com/OpenAPITools/openapi-generator/pull/16125/files
# https://stackoverflow.com/a/76330785/11046178
# TODO: remove this patch when the PR will be merged
# and change version to latest?
generate:
	docker run --rm \
  -v ${PWD}:/local openapitools/openapi-generator-cli:v7.0.0-beta generate \
  -i /local/services/back/openapi-zkorum.json \
  -g typescript-axios \
  -t /local/.openapi-generator/templates \
  -o /local/services/front/src/api

sync:
	cd services/shared && pnpm run sync

dev-sync:
	watchman-make -p 'services/shared/src/**/*.ts' -t sync

dev-generate:
	watchman-make -p 'services/back/openapi-zkorum.json' -t generate

dev-front:
	cd services/front && pnpm dev 

dev-back:
	cd services/back && pnpm start:dev 
	
