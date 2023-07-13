all: dev

generate:
	docker run --rm \
  -v ${PWD}:/local openapitools/openapi-generator-cli generate \
  -i /local/services/back/swagger-spec.json \
  -g typescript-axios \
  -o /local/services/front/src/api

dev-generate:
	watchman-make -p 'services/back/swagger-spec.json' -t generate

dev-front:
	cd services/front && pnpm dev 

dev-back:
	cd services/back && pnpm start:dev 
	
