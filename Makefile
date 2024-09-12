up:
	docker compose up -d

install:
	docker exec -it undrr-mangrove-client-1 bash -c "yarn install"

run:
	@docker ps | grep undrr-mangrove-client-1 > /dev/null && \
	docker exec -it undrr-mangrove-client-1 bash -c "yarn run storybook --ci" || \
	echo "Container 'undrr-mangrove-client-1' is not running"

build:
	@docker ps | grep undrr-mangrove-client-1 > /dev/null && \
	docker exec -it undrr-mangrove-client-1 bash -c "yarn run build"

build-storybook:
	@docker ps | grep undrr-mangrove-client-1 > /dev/null && \
	docker exec -it undrr-mangrove-client-1 bash -c "yarn run build-storybook"

lint:
	@docker ps | grep undrr-mangrove-client-1 > /dev/null && \
	docker exec -it undrr-mangrove-client-1 bash -c "yarn run lint"
