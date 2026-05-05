.PHONY: help install dev build start lint typecheck \
        db-migrate db-deploy db-reset db-seed db-studio db-generate \
        clean

# Source .env.local for prisma CLI (Next.js loads it automatically at runtime).
ENV := set -a && [ -f .env.local ] && . ./.env.local; set +a;

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "};{printf "\033[36m%-18s\033[0m %s\n",$$1,$$2}'

install: ## install deps
	pnpm install

dev: ## run dev server on $(PORT) (default 4000), bound to all interfaces for LAN access
	@LAN_IP=$$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null); \
	  [ -n "$$LAN_IP" ] && echo "   - Network:      http://$$LAN_IP:$${PORT:-4000}"; \
	  pnpm dev -p $${PORT:-4000} -H 0.0.0.0

build: ## prod build (prisma generate + next build)
	pnpm build

start: ## start prod server on $(PORT) (default 4000)
	pnpm start -p $${PORT:-4000}

lint: ## next lint
	pnpm lint

typecheck: ## tsc --noEmit
	pnpm typecheck

db-generate: ## prisma generate
	$(ENV) pnpm prisma generate

db-migrate: ## create + apply migration ($(NAME) required)
	@[ -n "$(NAME)" ] || (echo "usage: make db-migrate NAME=<name>"; exit 1)
	$(ENV) pnpm prisma migrate dev --name $(NAME)

db-deploy: ## apply pending migrations (no schema diff)
	$(ENV) pnpm prisma migrate deploy

db-reset: ## DROP + reapply all migrations + reseed (DESTRUCTIVE)
	$(ENV) pnpm prisma migrate reset --force

db-seed: ## run prisma/seed.ts
	$(ENV) pnpm db:seed

db-studio: ## open Prisma Studio
	$(ENV) pnpm prisma studio

clean: ## remove .next + tsbuildinfo
	rm -rf .next tsconfig.tsbuildinfo
