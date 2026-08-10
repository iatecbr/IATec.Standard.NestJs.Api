# IATec Standard NestJS API

Template padrão para novas APIs NestJS na IATec.
Clean Architecture / Vertical Slices com CQRS, PostgreSQL via MikroORM.

Derivado do template .NET `IATec.Standard.Net.Api.FromLib` (v2.1.0), seguindo a **Opção B — Fidelidade Máxima** conforme relatório técnico.

---

## Stack

| Preocupação | Biblioteca | Equivalente .NET |
|---|---|---|
| Framework | NestJS 11 | ASP.NET Core |
| CQRS / Mediator | @nestjs/cqrs | MediatR |
| ORM | MikroORM (PostgreSQL) | EF Core + Npgsql |
| Validação | Zod + nestjs-zod | FluentValidation |
| Tipo de retorno | neverthrow | FluentResults |
| Documentação | @nestjs/swagger + @scalar/nestjs-api-reference | Scalar.AspNetCore |
| Health checks | @nestjs/terminus | AspNetCore.HealthChecks |
| HTTP client | @nestjs/axios | IHttpClientFactory |
| Logging | nestjs-pino | ILogger<T> |
| Config | @nestjs/config | IOptions<T> |

---

## Comandos

```bash
# Instalar dependências
pnpm install

# Build
pnpm build

# Executar local (porta 5015, NODE_ENV=local, abre /documentation)
pnpm start:dev

# Testes
pnpm test
pnpm test -t "MyTest"

# Lint + Format
pnpm lint
pnpm format

# Criar migration
pnpm migration:create --name Init

# Aplicar migrations (obrigatório em local — auto-apply é pulado)
pnpm migration:up

# Docker (banco local)
docker compose -f docker/docker-compose.yml up -d
```

---

## Estrutura

```
src/
  main.ts                           # ← Program.cs (bootstrap)
  api/                              # ← src/Api (composition root)
    app.module.ts
    controllers/                    # vazio, proposital (como na origem)
    config/
      cors.setup.ts                 # ← CorsPolicyExtension.cs
      versioning.setup.ts           # ← VersioningExtension.cs
      scalar.setup.ts               # ← ScalarExtension.cs → /documentation
      health.module.ts              # ← HealthCheckExtension.cs → /_healthcheck/status
      health.controller.ts          # ← VersionHealthCheck
      migrations.setup.ts           # ← MigrationExtensions.cs (skip em local)
  application/                      # ← src/Application
    application.module.ts
    features/assets/
      commands/
      queries/
      schemas/
    dispatchers/logging/
  cross-cutting/                    # ← src/CrossCutting
    behaviors/
      pipeline-command.bus.ts       # ← ValidatorPipelineBehavior + ExceptionPipelineBehavior
      all-exceptions.filter.ts
      validator.decorator.ts
  domain/                           # ← src/Domain
    seedwork/base-entity.ts         # ← EntityUlidInt32
    models/people/people-aggregate/
      entities/
      value-objects/
  persistence/                      # ← src/Persistence
    persistence.module.ts
    mikro-orm.config.ts
    mappings/people/
    migrations/
  anti-corruption/                  # ← src/AntiCorruption
    services/iatec/log.service.ts
  message-queue/                    # ← src/MessageQueue (stub — no-op)
docker/
  Dockerfile
  Local.Dockerfile
  docker-compose.yml
secrets/
  secrets.yml
test/
  app.e2e-spec.ts
```

---

## Convenções

1. **Módulo por camada** — cada camada expõe um `*Module` que o `AppModule` importa.
2. **Pipeline CQRS** — `PipelineCommandBus` aplica validação Zod antes do handler + wraps exceptions em `Result`.
3. **Vertical Slices** — `features/{feature}/{commands,queries,schemas}`.
4. **Domain puro** — entidades e value objects sem decorators de ORM (mappings declarativos via `EntitySchema`).
5. **Identificadores duplos** — `id` (int, PK interna) + `externalId` (ULID char(26), exposto publicamente).
6. **snake_case no banco** — via configuração do MikroORM.
7. **Scalar oculto em produção** — guarda `if (environment === 'production') return;`.
8. **Auto-migração pulada em local** — rodar `pnpm migration:up` manualmente.

---

## Renomeação ao clonar

- `name` e `version` no `package.json`
- `APP_NAME` no `.env`
- Título em `scalar.setup.ts`
- Nome do banco em `POSTGRES_DATABASE`
- Schema/tabelas nos `EntitySchema`
- Placeholders no `secrets/secrets.yml`
- Este `README.md`

---

## Paridade com o template .NET v2.1.0

Consultar o relatório técnico `relatorio-template-nestjs.md` na raiz do repositório para o mapa completo de equivalência (Seção 6), pontos de atrito (Seção 7) e roadmap de implementação (Seção 12).
