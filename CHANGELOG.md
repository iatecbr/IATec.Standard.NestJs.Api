# Changelog

All notable changes to this project will be documented in this file.

## [2.1.0] - 2026-07-29

### Added
- Initial NestJS template derived from `IATec.Standard.Net.Api.FromLib` v2.1.0
- Clean Architecture with Vertical Slices (CQRS)
- MikroORM + PostgreSQL with EntitySchema mappings (snake_case)
- @nestjs/cqrs with PipelineCommandBus (ValidatorBehavior + ExceptionBehavior)
- Zod validation (equivalent to FluentValidation)
- neverthrow Result type (equivalent to FluentResults)
- @nestjs/swagger + @scalar/nestjs-api-reference at `/documentation`
- @nestjs/terminus health checks at `/_healthcheck/status`
- AntiCorruption layer with IATec LogService typed HttpClient
- Domain layer: People aggregate (Person, Document, Value Objects with validation)
- BaseEntity with dual identity (int id + ULID externalId)
- CORS, API versioning (querystring), auto-migration guard
- Docker multi-stage build + local docker-compose (postgres + redis)
- Kubernetes secrets template
- ESLint + Prettier configured
- nestjs-pino structured logging
- Jest + Supertest test setup
