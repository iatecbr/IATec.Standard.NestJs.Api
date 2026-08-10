# AGENTS.md

This is `IATec.Standard.NestJS.Api` — a scaffolding template (v2.1.0) for new NestJS APIs at IATec.
Clean Architecture / Vertical Slices with @nestjs/cqrs CQRS, PostgreSQL via MikroORM.
**It is a blank template.** Controllers, handlers, and test bodies are intentionally empty stubs.

---

## Key Toolchain

| Concern | Detail |
|---|---|
| Runtime | Node.js 22 LTS, TypeScript 5.7+ |
| Framework | NestJS 11 |
| ORM | MikroORM 6 + @mikro-orm/postgresql |
| Naming | MikroORM `UnderscoreNamingStrategy` — all DB identifiers are `snake_case` |
| CQRS | @nestjs/cqrs 11 |
| Validation | Zod 3 + nestjs-zod |
| Result type | neverthrow 8 — handlers return `Result<T, E>` |
| API docs | @nestjs/swagger + @scalar/nestjs-api-reference — UI at `/documentation`; OpenAPI JSON at `/openapi/v1.json` |

---

## Developer Commands

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run locally (port 5015, NODE_ENV=local, opens /documentation)
pnpm start:dev

# Run tests (unit + integration)
pnpm test
pnpm test -t "MyTest"

# Lint
pnpm lint

# Create a migration
pnpm migration:create --name <MigrationName>

# Apply migrations manually (required in local — auto-apply is skipped)
pnpm migration:up

# Start local infrastructure (postgres + redis)
docker compose -f docker/docker-compose.yml up -d
```

---

## Project Structure

```
src/
  main.ts             # Entrypoint — NestJS bootstrap (port 5015)
  api/                # Composition root — modules, config, controllers
  application/        # CQRS handlers, validators, dispatchers
  domain/             # People aggregate: Person, Document entities; value objects
  persistence/        # MikroORM EntitySchemas, migrations
  anti-corruption/    # Typed HttpClient → IATec Log Service
  cross-cutting/      # Pipeline behaviors (ValidatorBehavior, ExceptionBehavior)
  message-queue/      # Empty stub (no-op module)
docker/               # Dockerfile, Local.Dockerfile, docker-compose.yml
secrets/              # Kubernetes Secret template with #{...}# placeholders
test/                 # E2E tests
```

---

## Persistence / Database

- Single MikroORM configuration with potential for read/write split via ENV vars (`POSTGRES_HOST_READER` / `POSTGRES_HOST_WRITER`).
- Connection string assembled from environment variables; **`POSTGRES_PASSWORD` is blank by default** — the app will not connect without a password.
- **Auto-migration is skipped when `NODE_ENV === 'local'`** — always run `pnpm migration:up` manually.
- Schema: `people`, tables: `person`, `document`.

---

## Architecture Conventions

### Pipeline order (in PipelineCommandBus)
1. Validation (Zod schema via `@ValidateWith`) — equivalent to ValidatorPipelineBehavior
2. Exception wrapping — equivalent to ExceptionPipelineBehavior

### Domain model
- Aggregate roots extend `BaseEntity` — provides both `number id` and `string externalId` (ULID char(26)).
- Value objects have private constructors; factory methods return `Result<VO, string>` via neverthrow.
- Collections exposed as `ReadonlyArray<T>` backed by private arrays.
- Private constructors + static `create()` factory methods.

### Environments
- `local` / `development` — Scalar UI active at `/documentation`.
- `local` — auto-migration skipped.
- `production` — Scalar UI hidden.

---

## Gotchas

1. **CORS is fully open** (`origin: '*'`) — restrict before production.
2. **No auth middleware** — add guards explicitly if needed.
3. **`LOG_SERVICE_URL` is blank** — LogService calls will fail silently (exceptions are swallowed).
4. **`{API_NAME}` placeholders** remain in `scalar.setup.ts` and `secrets/secrets.yml` — replace when cloning.
5. **`Controllers/` is empty** — no endpoints exist; all feature handlers return `err(NOT_IMPLEMENTED)`.
6. **MessageQueue module is a no-op** — implement BullMQ + SNS/SQS when needed.

---

## Renaming When Cloning as a New API

- Update `name` and `version` in `package.json` (start at `1.0.0`).
- Replace `APP_NAME` in `.env` and `.env.example`.
- Update `POSTGRES_DATABASE` for the new service.
- Update schema/table names in `EntitySchema` mappings.
- Replace `{API_NAME}` in `scalar.setup.ts`.
- Set all `secrets.yml` placeholders.
- Write the `CHANGELOG.md` and update this `AGENTS.md`.
