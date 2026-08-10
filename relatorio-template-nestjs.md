# Relatório Técnico — Template NestJS derivado de `IATec.Standard.Net.Api`

**Opção arquitetural adotada:** **B — Fidelidade Máxima ao template .NET**
**Data:** 28/07/2026 · **Revisão:** 30/07/2026 (Seções 8, 9 e 10 acrescidas)
**Repositório de origem analisado:** `iatecbr/IATec.Standard.Net.Api.FromLib` (v2.1.0)
**Natureza deste documento:** relatório de análise e decisão arquitetural. **Não é um guia de implementação nem contém código de produção** — os trechos de código servem apenas para ilustrar decisões de design.

---

## 1. Sumário executivo

Foi realizada a leitura integral do template .NET `IATec.Standard.Net.Api.FromLib` (v2.1.0) e o mapeamento de cada um dos seus padrões arquiteturais para o ecossistema NestJS, com posterior aferição de adoção de mercado via downloads reais do registro npm.

Três stacks candidatas foram avaliadas. A escolhida é a **Opção B — Fidelidade Máxima**, que privilegia a **paridade arquitetural 1:1 com o template .NET** em detrimento da popularidade das bibliotecas.

**Stack definida:**

```
NestJS 11 · Node 22 LTS · TypeScript 5.7
@nestjs/cqrs        → equivalente ao MediatR
MikroORM (postgres) → equivalente ao EF Core
Zod + nestjs-zod    → equivalente ao FluentValidation
neverthrow          → equivalente ao FluentResults
BullMQ + @nestjs/bullmq + @bull-board → equivalente ao Hangfire
SNS + SQS (SDK AWS oficial v3) + sqs-consumer → parcialmente equivalente ao MassTransit
@nestjs/swagger + @scalar/nestjs-api-reference → equivalente ao Scalar.AspNetCore
cockatiel           → equivalente ao Polly (retry, circuit breaker, timeout, bulkhead)
nestjs-i18n         → equivalente aos .resx + UseRequestLocalization()
@nestjs/config · @nestjs/terminus · @nestjs/axios · nestjs-pino · ulid
Jest + Supertest + Testcontainers (+ LocalStack) · Nx (isolamento de camadas)
```

**Conclusão principal:** a paridade é alcançável em **≈80% dos padrões com equivalência total (41 de 51)** e **≈92% somando as paridades parciais aceitáveis (47 de 51)**. Os padrões restantes concentram-se em sete pontos de atrito — cinco documentados na Seção 7, um na Seção 9.5 e um na Seção 10.4, sendo o mais crítico a **ausência de _pipeline behaviors_ no `@nestjs/cqrs`**, que exige extensão do `CommandBus`. No campo assíncrono (Seção 8), o **Hangfire tem substituto direto (BullMQ, ~90%)**, mas o **MassTransit não tem equivalente único em Node** — exige composição, atingindo ~65%. Já o **Polly tem equivalente direto (`cockatiel`, ~90%)** — e a Seção 9 registra que, embora o Polly esteja presente na origem via `IATec.Shared.HttpClient`, **nenhuma política está configurada**, omissão que o template NestJS deve corrigir. O mesmo padrão se repete na **localização** (Seção 10): satélites `pt-BR`/`es` publicados e `UseRequestLocalization()` jamais invocado.

**Custo assumido conscientemente:** três das quatro bibliotecas do núcleo da Opção B são de nicho no ecossistema Nest (MikroORM ~7%, nestjs-zod ~7%, @nestjs/cqrs ~3,4% de penetração). Isso é aceitável **desde que** as mitigações da Seção 12 sejam adotadas.

---

## 2. Escopo e método

| Etapa | Descrição |
|---|---|
| 1. Inventário | Leitura de 100% dos arquivos-fonte do template (`src/`, `docker/`, `secrets/`, `.sln`, `.csproj`, `README.md`, `CHANGELOG.md`, `AGENTS.md`). |
| 2. Extração de padrões | Identificação dos padrões arquiteturais, bibliotecas e convenções em uso. |
| 3. Mapeamento | Para cada padrão, busca do equivalente funcional mais próximo em NestJS. |
| 4. Aferição de mercado | Consulta a `api.npmjs.org/downloads/point/last-week` para 84 pacotes candidatos distintos (24 na rodada inicial, 36 de mensageria/jobs, 14 de resiliência e 11 de internacionalização — 85 aferições, sendo o `@golevelup/nestjs-rabbitmq` medido em duas rodadas), complementada por inspeção do grafo `project.assets.json` e verificação de APIs por instalação real dos pacotes. |
| 5. Decisão | Confronto entre fidelidade arquitetural e adoção de mercado; formulação de 3 opções; seleção da Opção B. |

**Limitação declarada:** os números de download refletem popularidade, não qualidade técnica nem endosso. Pacotes genéricos (Zod, Drizzle, Joi) têm contagens inflacionadas por uso fora do ecossistema Nest e por dependências transitivas.

---

## 3. Análise do template de origem (.NET)

### 3.1 Identidade

| Atributo | Valor |
|---|---|
| Nome | `IATec.Standard.Net.Api` (clone `FromLib`) |
| Versão | 2.1.0 |
| Runtime | .NET 10.0 (`net10.0`) |
| Arquitetura | Clean Architecture + Vertical Slices |
| Porta local | 5015 (`ASPNETCORE_ENVIRONMENT=Local`) |
| Documentação | Scalar em `/documentation`; OpenAPI em `/openapi/v1.json` |
| Estado | **Template em branco** — controllers inexistentes, handlers lançam `NotImplementedException`, projetos de teste vazios |

### 3.2 Camadas e responsabilidades

| Projeto | Responsabilidade | Estado |
|---|---|---|
| `Api` | Composition root, controllers, extensions de infraestrutura HTTP | Extensions completas; `Controllers/` **vazio** |
| `Application` | Handlers MediatR, validators, dispatchers | Feature `Assets` como stub; handlers sem implementação |
| `Domain` | Agregado `People` (`Person`, `Document`) e Value Objects | Entidades sem factory methods; VOs sem validação |
| `Persistence` | `DbContext`s, mappings, migrations | Funcional, com 1 bug crítico (ver 3.5) |
| `AntiCorruption` | Cliente tipado para o IATec Log Service | Funcional |
| `CrossCutting` | — | **Vazio** (apenas referências de pacote) |
| `MessageQueue` | — | **Vazio** (`ConfigureMessageQueue` é no-op) |
| `Domain.Tests` / `Application.Tests` | — | **Vazios**, sem framework de teste instalado |

### 3.3 Stack técnica identificada

| Preocupação | Biblioteca | Versão |
|---|---|---|
| CQRS / Mediator | MediatR | 14.1.0 |
| Validação | FluentValidation | 12.1.1 |
| Tipo de retorno | FluentResults | 4.0.0 |
| ORM | EF Core + Npgsql | 10.0.2 / 10.0.0 |
| Convenção de nomes | EFCore.NamingConventions (`snake_case`) | 10.0.0 |
| Documentação de API | Scalar.AspNetCore + Microsoft.AspNetCore.OpenApi | 2.14.14 / 10.0.8 |
| Versionamento | Asp.Versioning.Mvc (+ ApiExplorer) | 10.0.0 |
| Health checks | AspNetCore.HealthChecks.UI.Client | 9.0.0 |
| Bibliotecas internas | IATec.Shared.{Api, Application, Domain, Behaviors, HttpClient} | 1.2.0 / 2.0.0 / 2.0.1 / 1.3.0 / 3.0.0 |

### 3.4 Convenções arquiteturais extraídas

1. **Composition root por camada** — cada projeto expõe um extension method `ConfigureX(IServiceCollection)`; o `Program.cs` apenas encadeia. Isolamento total de registro de DI.
2. **Pipeline MediatR ordenado** — `ValidatorPipelineBehavior<,>` → `ExceptionPipelineBehavior<,>`, registrados via `AddOpenBehavior`.
3. **Vertical Slices** — `Features/{Feature}/{Commands,Queries,Validators}`, colocando comando, handler e validador na mesma vizinhança.
4. **Segregação Read/Write** — `ReadDataContext` com `NoTrackingWithIdentityResolution`; `WriteDataContext` com change tracking e posse das migrations. Connection strings distintas (`ServerReader` / `ServerWriter`) para réplica de leitura.
5. **Aggregate Root com identidade dupla** — `EntityUlidInt32` fornece `int32 Id` (chave interna, performática) e `char(26) ExternalId` (ULID, exposto publicamente).
6. **Value Objects como classes** (não `record`), mapeados via `OwnsOne`.
7. **Encapsulamento de coleções** — `private List<T>` exposto como `IReadOnlyCollection<T>`.
8. **Construtores privados** com factory methods estáticos previstos.
9. **Options Pattern tipado** — `services.Configure<T>(configuration.GetSection(T.Key))`.
10. **Anti-Corruption Layer** — integrações externas isoladas em projeto próprio, com `HttpClient` tipado.
11. **`snake_case` no banco**, `PascalCase` no código.
12. **Guarda por ambiente** — Scalar oculto em Produção; auto-migração pulada em `Local`.

### 3.5 Achados e passivos do template de origem

> Estes itens foram identificados durante a leitura e **devem ser corrigidos na origem** e **não replicados** no template NestJS.

| # | Severidade | Achado |
|---|---|---|
| 1 | 🔴 **Crítica** | `PostgreSqlOption.GetConnectionString()` monta a string terminando em `User Id={User};******` — a senha literal `******` em vez de `Password={Password}`. **A aplicação não conecta ao banco.** |
| 2 | 🔴 Crítica | `docker/Dockerfile` e `docker/Local.Dockerfile` têm **0 bytes**. Não há empacotamento. |
| 3 | 🟠 Alta | `SensitiveDataLogging: true` no `appsettings.json` padrão — vazamento de dados sensíveis em log fora do ambiente local. |
| 4 | 🟠 Alta | CORS totalmente aberto (`AllowAnyOrigin` + `AllowAnyMethod` + `AllowAnyHeader`). |
| 5 | 🟠 Alta | Nenhum middleware de autenticação/autorização — `UseAuthentication()` e `UseAuthorization()` não são chamados. |
| 6 | 🟡 Média | Seção `LogServiceOption` ausente do `appsettings.json`; `AddLoggingService` lança `ArgumentNullException` na resolução do `HttpClient`. Erros do `LogService` são silenciosamente engolidos no `catch`. |
| 7 | 🟡 Média | `secrets/secrets.yml` termina em `stringData:` sem nenhuma chave. |
| 8 | 🟢 Baixa | Pasta de migrations grafada `MIgrations/` (I maiúsculo) — typo fixado no `.csproj`. |
| 9 | 🟢 Baixa | Placeholders `{API_NAME}` remanescentes em `ScalarExtension.cs` (2 ocorrências), `README.md` e `secrets.yml`. |
| 10 | 🟢 Baixa | `.editorconfig` da raiz com 0 bytes; sem lint, format ou análise estática configurados. |
| 11 | 🟢 Baixa | Ausência de CI/CD — não existe `.github/workflows/`. |
| 12 | 🟠 Alta | **Polly presente porém inerte.** `IATec.Shared.HttpClient` 3.0.0 traz `Polly` 8.6.6 + `Microsoft.Extensions.Http.Polly` 10.0.8, mas `LoggingConfig.cs` registra o `HttpClient` apenas com `BaseAddress` — **sem retry, timeout ou circuit breaker**. Somado ao achado #6 (exceções engolidas), uma indisponibilidade do Log Service degrada a latência de todo request sem sinal observável. Detalhado na Seção 9.1. |
| 13 | 🟠 Alta | **Localização presente porém inerte.** `IATec.Shared.Behaviors` 1.2.0 e `IATec.Shared.HttpClient` 2.1.0 publicam *satellite assemblies* `pt-BR` e `es`, mas `UseRequestLocalization()` **nunca é chamado** — não há `CultureInfo`, `IStringLocalizer` nem `SupportedCultures` em nenhum arquivo-fonte. O `Accept-Language` é ignorado e tudo resolve pela cultura do container. Detalhado na Seção 10.1. |

**Oportunidade:** o template NestJS nasce com ESLint + Prettier por padrão do Nest CLI, corrigindo nativamente o achado #10.

---

## 4. Aferição de mercado

Downloads semanais no npm, coletados em 28/07/2026. A coluna de penetração usa `@nestjs/core` (12.909.630 DL/sem) como denominador — proxy para "quantos projetos Nest usam este pacote".

| Categoria | Pacote | DL/semana | Penetração em apps Nest |
|---|---|---|---|
| **Framework** | `@nestjs/core` | 12.909.630 | (base) |
| **ORM** | `drizzle-orm` | 16.360.490 | n/a (ecossistema geral) |
| | `@prisma/client` | 15.145.805 | n/a (ecossistema geral) |
| | `typeorm` | 4.963.996 | — |
| | `@nestjs/typeorm` | 2.994.246 | **~23%** |
| | `@mikro-orm/core` | 936.282 | **~7%** ← *escolhido* |
| **Validação** | `zod` | 240.496.198 | n/a (dep. transitiva massiva) |
| | `joi` | 23.688.703 | — |
| | `class-validator` | 10.831.410 | **~84%** |
| | `nestjs-zod` | 957.086 | **~7%** ← *escolhido* |
| **CQRS** | `@nestjs/cqrs` | 441.151 | **~3,4%** ← *escolhido* |
| **Result type** | `neverthrow` | 2.291.042 | ~18% ← *escolhido* |
| | `ts-results` | 246.885 | ~2% |
| **API docs** | `@nestjs/swagger` | 7.102.721 | **~55%** ← *escolhido* |
| | `@scalar/nestjs-api-reference` | 371.434 | ~3% ← *escolhido* |
| **Config** | `@nestjs/config` | 7.609.746 | ~59% ← *escolhido* |
| **HTTP client** | `@nestjs/axios` | 4.990.479 | ~39% ← *escolhido* |
| **Health** | `@nestjs/terminus` | 2.707.850 | ~21% ← *escolhido* |
| **Log** | `winston` | 26.714.796 | n/a (ecossistema geral) |
| | `nestjs-pino` | 2.253.446 | ~17% ← *escolhido* |
| **Contexto** | `nestjs-cls` | 1.210.335 | ~9% |
| **Testes** | `vitest` | 82.309.790 | n/a (ecossistema geral) |
| | `jest` | 45.520.699 | n/a ← *escolhido* |
| **Mensageria** | `@golevelup/nestjs-rabbitmq` | 207.461 | ~1,6% |

### 4.1 Leitura crítica

- **Downloads ≠ recomendação técnica.** `class-validator` domina (84%) essencialmente por ser o alvo do `ValidationPipe` embutido no Nest, apesar de histórico de manutenção irregular. Popularidade por default ≠ superioridade.
- **Números do ecossistema geral não são comparáveis.** Zod (240M) é dependência transitiva de grande parte do tooling moderno (incluindo SDKs de IA); Drizzle e Prisma são usados majoritariamente fora do Nest. Comparar esses valores com pacotes `@nestjs/*` seria um erro metodológico.
- **A baixa adoção do `@nestjs/cqrs` (3,4%) é esperada e não desqualificante.** Reflete que a maioria dos projetos Nest é CRUD com services diretos — um público arquiteturalmente distinto do template .NET em questão. O pacote é **oficial da equipe Nest** e mantido em paridade com as versões majors do framework.
- **Prisma foi descartado apesar de ser o ORM mais popular.** Sua abordagem de modelo anêmico gerado por schema é **incompatível** com os requisitos do template: construtores privados, Value Objects mapeados, encapsulamento de coleções e Unit of Work. A escolha do ORM aqui é dirigida por restrição arquitetural, não por popularidade.

---

## 5. Stack definida — Opção B (Fidelidade Máxima)

### 5.1 Dependências de runtime

| Preocupação | Pacote | Substitui (no .NET) |
|---|---|---|
| Framework | `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express` | ASP.NET Core |
| CQRS / Mediator | `@nestjs/cqrs` | MediatR |
| ORM | `@mikro-orm/core`, `@mikro-orm/postgresql`, `@mikro-orm/nestjs`, `@mikro-orm/migrations` | EF Core + Npgsql |
| Validação | `zod`, `nestjs-zod` | FluentValidation |
| Tipo de retorno | `neverthrow` | FluentResults |
| Configuração | `@nestjs/config` (+ validação por Zod) | Options Pattern / `IOptions<T>` |
| Documentação | `@nestjs/swagger`, `@scalar/nestjs-api-reference` | Microsoft.AspNetCore.OpenApi + Scalar.AspNetCore |
| Health checks | `@nestjs/terminus` | AspNetCore.HealthChecks |
| HTTP client | `@nestjs/axios` | `IHttpClientFactory` / typed HttpClient |
| **Resiliência** | `cockatiel` *(+ `opossum` opcional, apenas para métricas de breaker)* | **Polly** / `Microsoft.Extensions.Http.Resilience` |
| Rate limiting (entrada) | `@nestjs/throttler` | (inexistente na origem) |
| **Internacionalização** | `nestjs-i18n` | **`.resx`** + `Microsoft.Extensions.Localization` |
| Locales de validação | `zod` (52 locales nativos, via `localeError`) | Mensagens localizadas do FluentValidation |
| Logging | `nestjs-pino`, `pino-http` | `ILogger<T>` |
| **Jobs em background** | `bullmq`, `@nestjs/bullmq`, `@bull-board/api`, `@bull-board/nestjs` | **Hangfire** |
| **Mensageria — SNS/SQS** | `@aws-sdk/client-sns`, `@aws-sdk/client-sqs`, `@aws-sdk/credential-providers` | **MassTransit** (transporte) |
| **Consumo/produção SQS** | `sqs-consumer`, `sqs-producer` | MassTransit (consumers) |
| **Validação de SNS HTTPS** | `sns-validator` *(condicional)* | MassTransit (endpoint) |
| Identidade | `ulid` | `EntityUlidInt32` (IATec.Shared.Domain) |

### 5.2 Dependências de desenvolvimento

| Preocupação | Pacote | Substitui |
|---|---|---|
| Testes | `jest`, `ts-jest`, `@nestjs/testing` | xUnit |
| Testes E2E | `supertest` | `WebApplicationFactory` |
| Testes de integração | `testcontainers` | (inexistente na origem) |
| Testes AWS (SQS/SNS) | `@testcontainers/localstack` | (inexistente na origem) |
| Isolamento de camadas | `nx` **ou** `eslint-plugin-boundaries` | `ProjectReference` entre `.csproj` |
| Qualidade | `eslint`, `prettier` | `.editorconfig` (vazio na origem) |
| CLI do ORM | `@mikro-orm/cli` | `dotnet ef` |

### 5.3 Runtime e ferramentas

| Item | Valor |
|---|---|
| Node.js | 22 LTS |
| TypeScript | 5.7+ |
| Gerenciador de pacotes | pnpm (recomendado) ou npm |
| Porta local | 5015 (mantida para paridade) |
| Variável de ambiente | `NODE_ENV=local` (equivalente a `ASPNETCORE_ENVIRONMENT=Local`) |
| Infraestrutura exigida | PostgreSQL · **Redis** (BullMQ) · **SNS/SQS + DLQs** provisionados via IaC |

---

## 6. Mapa completo de equivalência de padrões

| # | Padrão / artefato .NET | Equivalente NestJS (Opção B) | Grau de paridade |
|---|---|---|---|
| 1 | `Program.cs` + `WebApplication.CreateBuilder` | `main.ts` + `NestFactory.create(AppModule)` | 🟢 Total |
| 2 | `ConfigureApi/Application/...` (extension methods) | `ApiModule`, `ApplicationModule`, … (`@Module`) | 🟢 Total |
| 3 | Extension methods `IServiceCollection` | Dynamic Modules (`Module.forRoot()`) + `setup*(app)` | 🟢 Total |
| 4 | `.csproj` por camada + `ProjectReference` | Libs Nx com `tags` e regras de dependência | 🟡 Parcial — depende de tooling externo |
| 5 | MediatR `IRequest` / `IRequestHandler` | `@nestjs/cqrs`: `ICommand`, `@CommandHandler`, `CommandBus` | 🟢 Total |
| 6 | `ValidatorPipelineBehavior<,>` | `CommandBus` estendido com validação prévia | 🟠 **Atrito** — sem suporte nativo |
| 7 | `ExceptionPipelineBehavior<,>` | Idem + `ExceptionFilter` global no HTTP | 🟠 **Atrito** |
| 8 | FluentValidation `AbstractValidator<T>` | Schema Zod em arquivo separado por feature | 🟢 Total (Zod é desacoplado do DTO, como o FluentValidation) |
| 9 | FluentResults `Result` / `Result<T>` | `neverthrow` `Result<T,E>`, `ok()`, `err()`, `.andThen()` | 🟢 Total |
| 10 | EF Core `DbContext` | MikroORM `EntityManager` | 🟢 Total |
| 11 | Change tracking / Unit of Work | Unit of Work + Identity Map nativos do MikroORM | 🟢 Total — **exclusivo do MikroORM no ecossistema Node** |
| 12 | `IEntityTypeConfiguration<T>` | `EntitySchema` (mapping declarativo fora da entidade) | 🟢 Total |
| 13 | `OwnsOne` (Value Object) | `@Embeddable` / `@Embedded` | 🟢 Total |
| 14 | `EFCore.NamingConventions` (snake_case) | `UnderscoreNamingStrategy` | 🟢 Total |
| 15 | `ReadDataContext` (NoTracking) | EM `read` com `disableIdentityMap` / `em.fork()` | 🟢 Total |
| 16 | `WriteDataContext` | EM `write`, dono das migrations | 🟢 Total |
| 17 | `ServerReader` / `ServerWriter` | Duas conexões nomeadas (`contextName`) | 🟢 Total |
| 18 | `dotnet ef migrations add` | `mikro-orm migration:create` | 🟢 Total |
| 19 | `dotnet ef database update` | `mikro-orm migration:up` | 🟢 Total |
| 19a | `context.Database.Migrate()` (auto-migração no boot) | `await orm.migrator.up()` — **não** `orm.getMigrator()` / `em.getMigrator()`, depreciados no MikroORM 6. Exige registrar a extensão `Migrator` (`extensions: [Migrator]`) na config do ORM | 🟢 Total |
| 20 | Skip auto-migração em `Local` | Guarda `if (NODE_ENV === 'local') return;` no bootstrap, antes de `await orm.migrator.up()` | 🟢 Total |
| 21 | `EntityUlidInt32` (int + ULID) | `BaseEntity` abstrata: `@PrimaryKey id: number` + `externalId: string` (`char(26)`, pacote `ulid`) | 🟢 Total |
| 22 | Construtor privado + factory estático | `private constructor()` + `static create()` | 🟡 Parcial — garantia só em tempo de compilação |
| 23 | `private List<T>` → `IReadOnlyCollection<T>` | `#documents: Document[]` → getter `ReadonlyArray<Document>` (ou `Collection<T>` do MikroORM) | 🟡 Parcial |
| 24 | `IOptions<T>` + `Configure<T>` | `registerAs('postgres', …)` + `ConfigType<typeof cfg>` | 🟢 Total |
| 25 | `appsettings.json` / `.{Env}.json` | `.env` + namespaces de config + validação Zod no boot | 🟡 Parcial — modelo diferente, resultado equivalente |
| 26 | Scalar em `/documentation` | `@scalar/nestjs-api-reference` na mesma rota | 🟢 Total |
| 27 | OpenAPI em `/openapi/v1.json` | `@nestjs/swagger` (`SwaggerModule.createDocument`) | 🟢 Total |
| 28 | Scalar oculto em Produção | Guarda `if (process.env.NODE_ENV !== 'production')` | 🟢 Total |
| 29 | `Asp.Versioning` via `?api-version=` | `enableVersioning({ type: VersioningType.CUSTOM, extractor })` | 🟡 Parcial — querystring exige extractor próprio |
| 30 | HealthCheck em `/_healthcheck/status` | `@nestjs/terminus` na mesma rota | 🟢 Total |
| 31 | `VersionHealthCheck` (versão do assembly) | Indicator custom lendo `version` do `package.json` | 🟢 Total |
| 32 | CORS `AddCorsPolicy` / `UseCors` | `app.enableCors({ … })` com `exposedHeaders` | 🟢 Total |
| 33 | AntiCorruption `HttpClient` tipado | `HttpModule.registerAsync` + classe `LogService` | 🟢 Total |
| 34 | `ILogDispatcher` (interface) | Token `Symbol` + `{ provide, useClass }` | 🟡 Parcial — interfaces não existem em runtime no TS |
| 35 | `ILogger<T>` | `nestjs-pino` (log estruturado + correlation id) | 🟢 Total — superior à origem |
| 36 | `MessageQueue` no-op | Lib `message-queue`: BullMQ (jobs) + SNS/SQS (mensageria) + relay de outbox — **implementada**, ao contrário da origem | 🟢 Superior à origem |
| 37 | `CrossCutting` (vazio) | Lib `cross-cutting` com os behaviors do bus | 🟢 Total |
| 38 | xUnit (`Domain.Tests`, `Application.Tests`) | Jest (`*.spec.ts`) + `@nestjs/testing` | 🟢 Total |
| 39 | `GenerateDocumentationFile` (XML docs) | TSDoc + plugin CLI do `@nestjs/swagger` | 🟢 Total |
| 40 | `docker/Dockerfile` (vazio) | Multi-stage `node:22-alpine` | 🟢 Total (a escrever) |
| 41 | `docker/Local.Dockerfile` (vazio) | `nest start --watch` com volume montado | 🟢 Total (a escrever) |
| 42 | `secrets/secrets.yml` (k8s) | Idêntico, mesmos placeholders `#{…}#` | 🟢 Total |
| 43 | **Polly** (retry, circuit breaker, timeout, bulkhead, fallback) | `cockatiel` — mesmas políticas, mesma semântica de `wrap`/`PolicyWrap` | 🟢 Total (~90%; sem hedging e sem telemetria nativa) |
| 44 | `AddStandardResilienceHandler()` aplicado ao `HttpClient` tipado | Interceptor axios que envolve toda request na policy (`ResilientHttpModule.forFeature`) | 🟠 **Atrito** — sem `IHttpClientFactory`, a aplicação automática exige código próprio (Seção 9.5) |
| 45 | Rate limiting de entrada | `@nestjs/throttler` | 🟢 Superior à origem (inexistente no .NET analisado) |
| 46 | `.resx` + satélites por cultura | `i18n/{lang}/*.json` + `I18nJsonLoader` | 🟢 Total |
| 47 | `IStringLocalizer<T>` | `I18nService.t()` / `I18nContext.current()` | 🟢 Total |
| 48 | `UseRequestLocalization()` + negociação `Accept-Language` | `AcceptLanguageResolver` na cascata de resolvers | 🟢 Total — **ativado**, ao contrário da origem |
| 49 | `CultureInfo.CurrentUICulture` (`AsyncLocal`) | `AsyncLocalStorage` (mesma primitiva) | 🟢 Total |
| 50 | Mensagens de validação localizadas (FluentValidation) | Locales nativos do Zod 4 via `localeError` por parse | 🟠 **Atrito** — `nestjs-i18n` depende de `class-validator`; exige integração própria (Seção 10.4) |
| 51 | Chave de tradução verificada em compilação | `typesSafeOutputPath` → `I18nTranslations` | 🟢 Superior à origem |

**Resumo:** 41 de 51 padrões (≈80%) com paridade total; 6 parciais (🟡) e 4 com atrito real (🟠) — somando total + parcial, ≈92%. Os 4 padrões 🟠 correspondem a **três** dos sete pontos de atrito do relatório (#6 e #7 → Seção 7.1; #44 → Seção 9.5; #50 → Seção 10.4); os outros quatro pontos de atrito (Seções 7.2 a 7.5) recaem sobre padrões classificados como 🟡 Parcial.

---

## 7. Pontos de atrito e decisões de design

### 7.1 🔴 Pipeline Behaviors — o principal gap

**Problema.** O `@nestjs/cqrs` não oferece o conceito de _pipeline behavior_ do MediatR. Não há ponto de extensão declarativo equivalente a `config.AddOpenBehavior(typeof(ValidatorPipelineBehavior<,>))`.

**Por que interceptors do Nest não resolvem sozinhos.** `NestInterceptor` opera no pipeline **HTTP** (controller), não no barramento de comandos. Um comando despachado fora de um request HTTP (job, consumer de fila) não passaria pelos interceptors — quebrando a garantia que o `ValidatorPipelineBehavior` oferece no .NET.

**Decisão adotada.** Estender o `CommandBus` e o `QueryBus`, sobrescrevendo `execute()` para aplicar a cadeia de behaviors antes de delegar ao handler. A ordem é preservada: validação → exceção.

```ts
// ILUSTRATIVO — decisão de design, não implementação final
@Injectable()
export class PipelineCommandBus extends CommandBus {
  override async execute<T extends ICommand, R>(command: T): Promise<R> {
    // 1º ValidatorPipelineBehavior
    await this.validators.validate(command);
    try {
      // 2º ExceptionPipelineBehavior
      return await super.execute<T, R>(command);
    } catch (e) {
      throw this.exceptionMapper.map(e);
    }
  }
}
```

**Alternativas descartadas:**

| Alternativa | Motivo da recusa |
|---|---|
| Interceptors globais do Nest | Não cobrem despachos fora do ciclo HTTP |
| `ValidationPipe` global | Valida DTO de entrada, não o comando; perde a semântica de "validator por comando" |
| Decorators nos handlers | Exige anotar cada handler manualmente; perde o caráter transversal |
| Biblioteca de terceiros (`nestjs-mediator` etc.) | Adoção residual; risco de abandono superior ao custo de ~40 linhas próprias |

**Custo:** ~40–60 linhas de código de infraestrutura próprio, alocado na lib `cross-cutting` (mesmo papel do `IATec.Shared.Behaviors`).

---

### 7.2 🟡 Value Objects e construtores privados

**Problema.** TypeScript não possui encapsulamento real em runtime: `private constructor` é apagado na transpilação e `Object.create()` ou cast contornam a restrição.

**Decisão.** Aceitar a garantia em tempo de compilação, reforçada por:
- `private constructor()` + `static create(): Result<VO, ValidationError>` (retornando `neverthrow`, o que já melhora a origem, onde os VOs **não validam nada**);
- campos privados de classe (`#value`) para imutabilidade real em runtime;
- regra de ESLint proibindo `new` direto sobre classes de VO fora do próprio arquivo.

**Ganho sobre a origem.** Os VOs do template .NET (`FirstNameValue`, `IssuerValue`, etc.) declaram `FieldMinLength`/`FieldMaxLength` mas **não os aplicam** — as constantes só são consumidas no mapping do EF. O template NestJS deve validar no `create()`, corrigindo a lacuna.

---

### 7.3 🟡 Isolamento físico de camadas

**Problema.** Sem `.csproj`, nada impede que `Domain` importe de `Persistence`, violando a Clean Architecture. No .NET isso é erro de compilação.

**Decisão.** Adotar **Nx** com libs por camada e regras de dependência por `tags`:

| Lib | `tag` | Pode depender de |
|---|---|---|
| `domain` | `layer:domain` | (nada) |
| `application` | `layer:application` | `domain`, `cross-cutting` |
| `persistence` | `layer:persistence` | `domain` |
| `anti-corruption` | `layer:anti-corruption` | `domain` |
| `api` | `layer:api` | todas |

A violação passa a ser **erro de lint/build**, restaurando a garantia do `ProjectReference`.

**Alternativa mais leve:** `eslint-plugin-boundaries`, se o overhead do Nx for indesejado.

---

### 7.4 🟡 Configuração por ambiente

**Problema.** Não existe equivalente direto a `appsettings.{Environment}.json` com merge automático.

**Decisão.** `@nestjs/config` com `envFilePath: ['.env.${NODE_ENV}', '.env']` + `registerAs()` por seção + **validação Zod no bootstrap** (fail-fast).

**Ganho sobre a origem.** O achado #1 da Seção 3.5 (senha ausente/`******`) seria detectado no boot com mensagem explícita, em vez de falhar em runtime na primeira query. Igualmente, `LogServiceOption` ausente (achado #6) seria capturado imediatamente.

---

### 7.5 🟡 Versionamento por querystring

**Problema.** O Nest suporta nativamente `URI`, `HEADER` e `MEDIA_TYPE`; a origem usa `QueryStringApiVersionReader("api-version")`.

**Decisão.** `VersioningType.CUSTOM` com extractor lendo `req.query['api-version']`, com default `'1'` (equivalente a `AssumeDefaultVersionWhenUnspecified = true`).

**Nota:** `ReportApiVersions = true` (header de resposta com versões suportadas) não tem equivalente nativo — exige middleware próprio, ou pode ser conscientemente descartado.

---

### 7.6 🟢 Interfaces como contratos de DI

TypeScript apaga interfaces em runtime, impedindo `services.AddScoped<ILogDispatcher, LogDispatcher>()`. Solução consolidada no ecossistema: tokens (`const LOG_DISPATCHER = Symbol('ILogDispatcher')`) com `{ provide: LOG_DISPATCHER, useClass: LogDispatcher }` e `@Inject(LOG_DISPATCHER)`. Sem perda funcional; apenas mais verboso.

---

## 8. Mensageria e processamento assíncrono

O template .NET deixa o projeto `MessageQueue` como stub (`ConfigureMessageQueue` é no-op), mas o parque de APIs IATec utiliza **Hangfire** (jobs em background) e **MassTransit** (barramento de mensagens). Esta seção define os equivalentes.

### 8.1 Aferição de mercado — jobs e mensageria

Downloads npm/semana, 28/07/2026. Base: `@nestjs/core` = 12.909.630.

| Categoria | Pacote | DL/semana | Penetração |
|---|---|---|---|
| **Jobs** | `bullmq` | **7.570.118** | — ← *escolhido* |
| | `@nestjs/bullmq` | **1.874.098** | **~15%** ← *escolhido* |
| | `@bull-board/api` | 1.770.474 | ~14% ← *escolhido* |
| | `@bull-board/nestjs` | 390.590 | ~3% ← *escolhido* |
| | `@nestjs/schedule` | 4.325.224 | ~34% |
| | `bull` (legado) | 1.627.657 | ~13% |
| | `pg-boss` | 1.132.515 | ~9% |
| | `graphile-worker` | 358.939 | ~3% |
| | `agenda` | 184.044 | ~1,4% |
| | `croner` / `node-cron` | 8.043.234 / 6.343.454 | (parsers de cron) |
| | `inngest` / `@trigger.dev/sdk` | 1.424.134 / 747.753 | (SaaS) |
| **Workflow** | `@temporalio/client` / `worker` | 3.240.202 / 2.860.064 | ~25% / ~22% |
| **Mensageria** | `@nestjs/microservices` | 2.265.854 | ~18% |
| | `@golevelup/nestjs-rabbitmq` | 207.461 | ~1,6% |
| | `amqplib` | 2.897.387 | — |
| | `kafkajs` | 3.378.049 | — |
| | `@confluentinc/kafka-javascript` | 908.631 | — |
| | `nats` | 945.576 | — |
| | `@nestjs/event-emitter` | 2.034.139 | ~16% |
| | `moleculer` | 62.205 | ~0,5% |
| **AWS** | `@aws-sdk/credential-providers` | 14.443.780 | — ← *escolhido* |
| | `@aws-sdk/client-sqs` | **9.903.015** | — ← *escolhido* |
| | `@aws-sdk/client-sns` | **4.451.085** | — ← *escolhido* |
| | `aws-sdk` (v2) | 9.317.230 | 🔴 fim de suporte |
| | `sqs-consumer` | 1.679.820 | — ← *escolhido* |
| | `sqs-producer` | 411.803 | — ← *escolhido* |
| | `@ssut/nestjs-sqs` | 199.679 | ~1,5% |
| | `sns-validator` | 317.450 | ~2,5% ← *condicional* |
| | `@aws-sdk/client-eventbridge` | 3.086.206 | — |
| | `@aws-sdk/client-sfn` (Step Functions) | 2.661.146 | — |
| | `@aws-sdk/client-scheduler` | 1.280.705 | — |
| | `@testcontainers/localstack` | 522.802 | ~4% ← *escolhido (dev)* |
| | `@nestjs-packages/sqs` | 2.442 | 🔴 morto (último release 2022) |

---

### 8.2 Hangfire → **BullMQ** (escolha definida)

**O que o Hangfire entrega:** enfileiramento fire-and-forget, jobs atrasados, recorrentes (cron), continuations, retry com backoff, persistência, dashboard web, workers distribuídos.

**Escolha: `bullmq` + `@nestjs/bullmq` + `@bull-board/nestjs`.**

| Recurso do Hangfire | Equivalente no BullMQ | Paridade |
|---|---|---|
| Fire-and-forget (`Enqueue`) | `queue.add(name, data)` | 🟢 Total |
| Job atrasado (`Schedule`) | `queue.add(…, { delay })` | 🟢 Total |
| Job recorrente (`RecurringJob`) | `queue.upsertJobScheduler(…, { pattern: cron })` | 🟢 Total |
| Continuations (`ContinueJobWith`) | **Flows** (`FlowProducer`) — grafo pai/filho | 🟢 Total (superior) |
| Retry automático + backoff | `attempts` + `backoff: { type: 'exponential' }` | 🟢 Total |
| Dashboard | `@bull-board/nestjs` (UI web de filas, jobs, retries, replay) | 🟢 Total |
| Workers distribuídos | N réplicas consumindo a mesma fila; lock atômico via Redis | 🟢 Total |
| Prioridade / concorrência | `priority`, `concurrency`, rate limiting nativo | 🟢 Total (superior) |
| Storage | **Redis** (Hangfire usa SQL) | 🟡 Diferente |

**Cobertura estimada: ~90% do Hangfire.**

**Justificativa da escolha sobre o `pg-boss`:**

1. **Adoção** — BullMQ tem 7,57M DL/sem contra 1,13M do pg-boss; `@nestjs/bullmq` é o módulo de filas com maior penetração no ecossistema Nest (~15%).
2. **Módulo oficial NestJS** — `@nestjs/bullmq` é mantido pela equipe do Nest, com decorators `@Processor()` / `@Process()` e ciclo de vida integrado ao container de DI. O pg-boss exige wrapper próprio.
3. **Dashboard** — o `@bull-board` entrega o equivalente direto ao painel do Hangfire, que é justamente o diferencial da ferramenta na origem. O pg-boss não tem UI.
4. **Paridade de recursos** — Flows cobrem continuations; backoff exponencial, rate limiting e prioridade são nativos. No pg-boss vários desses itens seriam implementados manualmente.
5. **Maturidade operacional** — BullMQ é a evolução do Bull, com mais de uma década de uso em produção.

**⚠️ Consequências assumidas:**

| Consequência | Detalhe | Mitigação |
|---|---|---|
| **Nova dependência de infraestrutura** | Exige **Redis** (ElastiCache / Redis gerenciado), que o template hoje não possui | Adicionar Redis ao `docker-compose` local, ao `secrets.yml` e ao IaC. Documentar como pré-requisito no README |
| **Perda do outbox "de graça"** | Com storage em Redis, não é possível enfileirar o job na mesma transação Postgres do agregado | Padrão **Transactional Outbox explícito** (ver 8.4) |
| **Durabilidade** | Redis exige AOF/RDB e réplica configurados, ou há risco de perda de jobs | Persistência AOF habilitada + Redis gerenciado com failover |

**Descartados:** `@nestjs/schedule` (só cron em memória — sem persistência, sem retry e **sem lock distribuído**, duplicando execução em múltiplas réplicas; pode ser usado apenas para tarefas locais triviais), `bull` (legado), `agenda` (exige MongoDB), `pg-boss`/`graphile-worker` (menor adoção, sem dashboard), `inngest`/`trigger.dev` (SaaS — dado sai da infraestrutura).

---

### 8.3 MassTransit → composição (não há equivalente único)

**Achado relevante:** **não existe equivalente ao MassTransit no ecossistema Node.** Nenhuma biblioteca reúne abstração multi-transporte + sagas duráveis + outbox transacional + políticas de retry/redelivery. A solução é composição.

| Capacidade do MassTransit | Equivalente adotado | Paridade |
|---|---|---|
| Transporte / publish-subscribe | **SNS → SQS** (fan-out nativo AWS) | 🟢 ~85% |
| Consumers | `sqs-consumer` + handler no `CommandBus` | 🟢 ~80% |
| Retry / redelivery | `attempts`+backoff do BullMQ; `RedrivePolicy` da fila SQS | 🟡 ~70% |
| Dead-letter queue | DLQ do SQS (definida em IaC) | 🟢 ~85% |
| Outbox transacional | Tabela de outbox no Postgres + relay (ver 8.4) | 🟢 ~85% |
| Mensagem agendada | `delay` do BullMQ (sem limite) / `DelaySeconds` do SQS (máx. 15 min) | 🟡 ~70% |
| Saga / State Machine durável | **AWS Step Functions** ou **Temporal** — apenas quando houver necessidade real | 🟡 ~80% |
| Request/Response | `@nestjs/microservices` ou HTTP direto | 🟡 ~60% |
| Abstração multi-transporte | ❌ — a escolha por SQS/SNS amarra à AWS | 🔴 |
| Test harness | LocalStack via `@testcontainers/localstack` | 🟢 ~80% |

**Cobertura estimada: ~65% do MassTransit.**

> **Observação arquitetural:** SQS/SNS deslocam parte das responsabilidades do MassTransit (DLQ, redrive, retry, fan-out, filtros de assinatura) do **código** para a **infraestrutura**. Isso reduz o código necessário, mas exige que essas políticas sejam versionadas em IaC (`aws-cdk-lib` ou Terraform) e revisadas junto com o template — caso contrário viram configuração implícita e não auditável.

#### Bibliotecas SNS/SQS definidas

| Pacote | Papel | Status |
|---|---|---|
| `@aws-sdk/client-sqs` | SDK oficial v3 — operações de fila | ✅ Ativo |
| `@aws-sdk/client-sns` | SDK oficial v3 — publish, topics, subscriptions | ✅ Ativo |
| `@aws-sdk/credential-providers` | Credenciais via IRSA / IAM Roles no EKS — **sem chave estática** | ✅ Ativo |
| `sqs-consumer` (BBC) | Long polling, concorrência, extensão de visibility timeout, batch, graceful shutdown | ✅ Ativo (release 17/07/2026) |
| `sqs-producer` (BBC) | Envio em lote com chunking automático (limite de 10 msg/batch da AWS) | ✅ Ativo (release 21/05/2026) |
| `sns-validator` | 🔒 Validação de assinatura de mensagens SNS — **obrigatório** se a API expuser subscriber HTTPS | ⚠️ Estável, sem release desde 2022 |
| `@testcontainers/localstack` | SQS/SNS reais em container para testes de integração | ✅ Ativo (dev) |

**Decisão sobre a camada NestJS:** **não adotar `@ssut/nestjs-sqs`.** Apesar de ser a única integração Nest viável (199k DL/sem, peer dep já compatível com Nest 11), está há ~18 meses sem release. O consumo será feito com `sqs-consumer` diretamente em um provider da lib `message-queue` — cerca de 15 a 20 linhas, coerente com a decisão já tomada de escrever o `PipelineCommandBus` à mão (Seção 7.1) e eliminando risco de dependência abandonada. O `@nestjs-packages/sqs` está morto (último release em 2022, peer deps travadas no Nest 9) e foi descartado.

**Nota:** o `@nestjs/microservices` **não possui transporte SQS oficial**. Integrá-lo exigiria uma `CustomTransportStrategy` própria, sem ganho sobre a abordagem acima.

---

### 8.4 Outbox transacional

Com o BullMQ em Redis e o SNS na AWS, o enfileiramento **não** participa da transação do Postgres. Para não perder a garantia de consistência que o MassTransit Outbox oferece, o padrão adotado é:

```
1. Handler abre transação (Unit of Work do MikroORM)
2. Persiste o agregado
3. Insere a mensagem na tabela `outbox` (mesma transação)  ← atômico
4. Commit
5. Worker relay (job recorrente do BullMQ) lê a outbox e publica no SNS/BullMQ
6. Marca como publicada
```

Garante **at-least-once**; consumidores devem ser idempotentes (chave de deduplicação pelo `externalId`/ULID já disponível na `BaseEntity`).

---

### 8.5 Stack final de assíncrono

```
bullmq + @nestjs/bullmq + @bull-board/nestjs   ← Hangfire
@aws-sdk/client-sns + @aws-sdk/client-sqs      ← transporte (libs oficiais)
@aws-sdk/credential-providers                  ← IRSA, sem chave estática
sqs-consumer + sqs-producer                    ← consumo/produção
sns-validator                                  ← apenas se houver subscriber HTTPS
tabela outbox no Postgres + relay no BullMQ    ← MassTransit Outbox
@testcontainers/localstack                     ← testes de integração
[opcional] @aws-sdk/client-sfn ou @temporalio  ← apenas para sagas duráveis reais
```

**Infraestrutura adicional exigida:** Redis (BullMQ) + tópicos SNS, filas SQS e DLQs provisionados via IaC.

---

## 9. Resiliência e tolerância a falhas

### 9.1 O que a origem realmente usa

A análise do grafo de dependências resolvido (`src/Api/obj/project.assets.json`) revelou um ponto **não identificado na primeira leitura da Seção 3**:

```
AntiCorruption.csproj
  └─ IATec.Shared.HttpClient 3.0.0
       ├─ Polly 8.6.6
       └─ Microsoft.Extensions.Http.Polly 10.0.8
```

O **Polly está presente no template**, trazido transitivamente pela biblioteca interna `IATec.Shared.HttpClient`.

**Porém: nenhuma política é efetivamente configurada.** O `LoggingConfig.cs` registra o cliente tipado com `AddHttpClient<ILogService, LogService>(…)` definindo apenas o `BaseAddress` — sem `AddPolicyHandler`, sem `AddStandardResilienceHandler`. A capacidade existe, mas está **latente e não exercida**.

> **Achado adicional (#12 da Seção 3.5):** a única chamada HTTP externa do template (Log Service) não possui retry, timeout nem circuit breaker configurados. Combinado com o achado de que as exceções do Log Service são engolidas silenciosamente, uma indisponibilidade do serviço externo degrada latência do request sem qualquer sinal observável.

Consequência para este relatório: o equivalente ao Polly **deve** entrar na stack do template NestJS — e, mais que isso, deve ser **efetivamente configurado**, corrigindo a omissão da origem.

---

### 9.2 Equivalente ao Polly no ecossistema Node

O equivalente direto é **`cockatiel`**, biblioteca criada pela equipe do **Visual Studio Code (Microsoft)** e declaradamente inspirada no Polly ("*a resilience and transient-fault-handling library […] inspired by .NET's Polly*").

| Política do Polly | Equivalente em `cockatiel` | Paridade |
|---|---|---|
| `Policy.Handle<T>().Retry(n)` | `retry(handleType(Err), { maxAttempts })` | 🟢 Total |
| `WaitAndRetry` com backoff | `ExponentialBackoff`, `ConstantBackoff`, `IterableBackoff` (+ jitter por padrão) | 🟢 Total |
| `CircuitBreakerPolicy` | `circuitBreaker(policy, { halfOpenAfter, breaker })` | 🟢 Total |
| `AdvancedCircuitBreaker` (taxa em janela) | `SamplingBreaker({ threshold, duration, minimumRps })` | 🟢 Total |
| `CircuitBreaker` por contagem | `ConsecutiveBreaker(n)` | 🟢 Total |
| `TimeoutPolicy` (pessimista/otimista) | `timeout(ms, TimeoutStrategy.Aggressive \| Cooperative)` | 🟢 Total |
| `BulkheadPolicy` | `bulkhead(limit, queueLimit)` | 🟢 Total |
| `FallbackPolicy` | `fallback(policy, valueOrFactory)` | 🟢 Total |
| `PolicyWrap` | `wrap(p1, p2, p3)` (mesma semântica de aninhamento) | 🟢 Total |
| `ResiliencePipelineBuilder` (Polly v8) | `wrap()` + decorator `@Policy.use(policy)` | 🟢 Total |
| `CancellationToken` propagado | `AbortSignal` propagado no contexto de execução | 🟢 Total |
| Eventos (`onRetry`, `onBreak`, `onReset`) | `onRetry`, `onBreak`, `onReset`, `onHalfOpen`, `onFailure`, `onSuccess` | 🟢 Total |
| `HedgingPolicy` (Polly v8) | ❌ Inexistente | 🔴 Ausente |
| Telemetria/métricas nativa (`Polly.Extensions`) | ❌ Só eventos — instrumentação manual | 🟡 Parcial |
| `RateLimiterPolicy` (Polly v8) | ❌ Inexistente (usar `@nestjs/throttler` no ingresso) | 🟡 Parcial |

**Cobertura estimada: ~90% do Polly.** As três lacunas são de baixo impacto para o perfil de uso do template (uma única integração HTTP externa).

---

### 9.3 Aferição de mercado

Downloads npm/semana e status de manutenção verificados em **29/07/2026**.

| Pacote | DL/sem | Última versão | Escopo | Veredito |
|---|---|---|---|---|
| **`cockatiel`** | **1,87M** | **v4.0.0 — 26/05/2026** ✅ | Retry, circuit breaker, timeout, bulkhead, fallback, wrap | ⭐ **Escolhido.** Polly completo, zero dependências, TS-first, decorator para DI |
| **`opossum`** (Red Hat) | 1,20M | **v10.0.0 — 24/06/2026** ✅ | Apenas circuit breaker | ⭐ **Complementar (opcional).** Único com **métricas Prometheus/Hystrix prontas** (`opossum-prometheus`) |
| `p-retry` | 46,1M | v8.0.0 — 26/03/2026 ✅ | Apenas retry | Ótimo, mas parcial. **ESM-only** — atrito com o build CJS padrão do Nest |
| `async-retry` | 28,7M | (estável, sem releases recentes) | Apenas retry | Legado amplamente difundido; sem tipos de primeira classe |
| `exponential-backoff` | 37,7M | ✅ | Apenas cálculo de backoff | Primitiva de baixo nível; volume inflado por dependência transitiva |
| `axios-retry` | 8,79M | v4.5.0 — **02/08/2024** ⚠️ | Retry no interceptor do axios | ~2 anos sem release. Resolve só retry e amarra a solução ao axios |
| `bottleneck` | 12,4M | v2.19.5 — **2019** 🔴 | Rate limit / throttling distribuído (Redis) | **Sem manutenção há 7 anos.** Volume por legado |
| `ts-retry-promise` | 0,80M | v0.8.1 — 19/05/2024 ⚠️ | Apenas retry | Sem vantagem sobre o `cockatiel` |
| `nestjs-resilience` | **6,7K** | v3.1.2 — 14/03/2025 ⚠️ | Wrapper Nest sobre políticas | 🔴 **Descartado.** Adoção residual (0,05% de penetração), mantenedor único |
| `polly-js` | 48K | ⚠️ | Só retry | Homônimo enganoso — **não** é porte do Polly .NET |
| `brakes` / `hystrixjs` / `circuit-breaker-js` | < 7K | 🔴 | Circuit breaker | Abandonados |
| `@nestjs/throttler` | 3,48M | v6.5.0 — 02/12/2025 ✅ | Rate limiting **de entrada** | Categoria distinta — complementar, não substituto |

**Penetração no ecossistema Nest** (base `@nestjs/core` = 12,9M DL/sem): `cockatiel` ≈ 14,5%, `opossum` ≈ 9,3%. Ambos com adoção **superior** à do próprio `@nestjs/cqrs` (3,4%) já aceito na Opção B — portanto não representam risco adicional de manutenção.

---

### 9.4 Decisão

**`cockatiel` como base única de políticas de resiliência**, com `opossum` admitido apenas se houver exigência formal de exportar métricas de circuit breaker para o Prometheus.

Pipeline padrão do template, equivalente ao `AddStandardResilienceHandler()` do .NET:

```
timeout (5s, Aggressive)
  ← circuitBreaker (SamplingBreaker: 50% de falha em 30s, halfOpenAfter 10s)
    ← retry (3 tentativas, ExponentialBackoff com jitter)
```

Ordem deliberada (idêntica à do handler padrão da Microsoft): o **timeout é o mais interno**, para limitar cada tentativa individual, não o conjunto. O **retry é o mais externo**, para que o breaker contabilize cada falha isolada.

Ilustração de design da lib `anti-corruption` (não é código de produção):

```ts
export const logServicePolicy = wrap(
  retry(handleAll, { maxAttempts: 3, backoff: new ExponentialBackoff() }),
  circuitBreaker(handleAll, {
    halfOpenAfter: 10_000,
    breaker: new SamplingBreaker({ threshold: 0.5, duration: 30_000 }),
  }),
  timeout(5_000, TimeoutStrategy.Aggressive),
);

await logServicePolicy.execute(({ signal }) =>
  firstValueFrom(this.http.post('/logs', dto, { signal })),
);
```

---

### 9.5 Ponto de atrito — ausência de `IHttpClientFactory`

🟠 **Sexto ponto de atrito do relatório** (soma-se aos cinco da Seção 7).

No .NET, `services.AddHttpClient<T>().AddStandardResilienceHandler()` aplica a política **automaticamente a todas as chamadas** do cliente tipado, via `DelegatingHandler`. O desenvolvedor não pode esquecer.

No Node não existe equivalente: `@nestjs/axios` expõe uma instância do axios sem cadeia de handlers componível. Restam duas abordagens:

| Abordagem | Como funciona | Avaliação |
|---|---|---|
| **A — `.execute()` explícito** | Cada chamada é envolvida manualmente na policy | Simples e explícito, porém **esquecível** — não há garantia estrutural |
| **B — Interceptor axios que envolve a request na policy** | `HttpModule.registerAsync` injeta um interceptor que aplica `policy.execute()` a toda request daquele cliente | ⭐ **Recomendada.** Reproduz a semântica do `DelegatingHandler`: a política passa a ser propriedade do cliente, não da chamada |

**Decisão:** adotar a **abordagem B**, encapsulada em um `ResilientHttpModule.forFeature({ policy })` na lib `cross-cutting`, de modo que qualquer novo cliente do `AntiCorruption` herde as políticas por construção. Custo estimado: < 40 linhas.

**Não usar retry em:** operações não idempotentes sem chave de deduplicação, e consumidores SQS (a redelivery já é responsabilidade da fila — retry em memória sobre mensagem SQS multiplica o `VisibilityTimeout` e mascara a DLQ).

---

### 9.6 Fronteiras de resiliência no template

| Fronteira | Mecanismo | Origem da política |
|---|---|---|
| HTTP de saída (Log Service, futuras integrações) | `cockatiel` (retry + breaker + timeout) | Código — lib `cross-cutting` |
| HTTP de entrada | `@nestjs/throttler` (rate limit) | Código — `ApiModule` |
| Jobs em background | `attempts` + `backoff` do BullMQ | Configuração da fila |
| Mensageria SQS | `maxReceiveCount` + `RedrivePolicy` (DLQ) | **Infraestrutura (IaC)** |
| Banco de dados | Pool + `connectionTimeout` do MikroORM | Configuração do driver |
| Encerramento gracioso | `app.enableShutdownHooks()` + `OnModuleDestroy` | Bootstrap |

> Regra do template: **resiliência de mensageria vive na infraestrutura; resiliência de HTTP vive no código.** Duplicar retry nas duas camadas produz amplificação de carga durante incidentes.

---

## 10. Internacionalização (i18n) e mensagens de erro

### 10.1 O que a origem realmente faz

Assim como ocorreu com o Polly (Seção 9.1), a inspeção do grafo resolvido revelou uma capacidade **presente e não exercida**:

```
IATec.Shared.Behaviors/1.2.0   → satellite assemblies: es, pt-BR
IATec.Shared.HttpClient/2.1.0  → satellite assemblies: es, pt-BR
Microsoft.Extensions.Localization.Abstractions 10.0.1
```

As bibliotecas internas **já são localizadas** — as mensagens dos behaviors existem compiladas em `.resx` para `pt-BR` e `es`.

**Porém: `UseRequestLocalization()` nunca é chamado.** O pipeline de `ApiDependencyInjectionConfig.cs` é `UseApiCorsPolicy() → UseRouting() → …`, sem `RequestLocalizationMiddleware`. Não há `CultureInfo`, `IStringLocalizer` ou `SupportedCultures` em nenhum arquivo-fonte do template.

Consequência: o **cabeçalho `Accept-Language` é ignorado**. Tudo resolve pelo `CurrentUICulture` do processo — a cultura do container, tipicamente invariant/`en`. Os satélites `pt-BR` e `es` são publicados na imagem e nunca servidos.

> **Achado #13 da Seção 3.5.** Padrão idêntico ao achado #12: dependência que entrega a capacidade, bootstrap que não a ativa.

---

### 10.2 Equivalente ao `.resx` no ecossistema Node

O equivalente é **`nestjs-i18n`**. A superfície de API foi verificada por instalação (v10.8.5):

```
Resolvers: AcceptLanguageResolver, HeaderResolver, QueryResolver,
           CookieResolver, GrpcMetadataResolver, GraphQLWebsocketResolver
Loaders:   I18nJsonLoader, I18nYamlLoader, I18nAbstractLoader
Contexto:  I18nContext (AsyncLocalStorage), I18nService
```

| Conceito .NET | Equivalente `nestjs-i18n` | Paridade |
|---|---|---|
| `Messages.pt-BR.resx` | `i18n/pt-BR/domain.json` (ou YAML) | 🟢 Total |
| `IStringLocalizer<T>` | `I18nService.t('domain.key')` | 🟢 Total |
| `UseRequestLocalization()` | `resolvers: [QueryResolver, HeaderResolver, AcceptLanguageResolver]` | 🟢 Total |
| Negociação `q=` do `Accept-Language` | `AcceptLanguageResolver` (quality-value nativo) | 🟢 Total |
| `SupportedCultures` + `DefaultRequestCulture` | `fallbackLanguage` + `fallbacks: { 'pt-*': 'pt-BR' }` | 🟢 Total |
| `IStringLocalizer["Msg", arg]` | `t('key', { args: { … } })` | 🟢 Total |
| `CultureInfo.CurrentUICulture` (`AsyncLocal`) | `I18nContext.current()` (`AsyncLocalStorage`) | 🟢 Total — **mesma primitiva** |
| Satélite compilado por cultura | Carregamento de arquivo + `loaderOptions.watch` | 🟢 Total (superior em DX) |
| — | `typesSafeOutputPath` → tipo `I18nTranslations`: **chave inexistente quebra o build** | 🟢 **Superior à origem** |

---

### 10.3 Aferição de mercado

Downloads npm/semana e releases verificados em **30/07/2026**.

| Pacote | DL/sem | Última versão | Veredito |
|---|---|---|---|
| **`nestjs-i18n`** | **406K** | **v10.8.5 — 07/07/2026** ✅ | ⭐ **Escolhido.** Único integrado ao ciclo do Nest (DI, resolvers, filters, tipos gerados). Penetração ≈3,2% — mesma faixa do `@nestjs/cqrs` já aceito |
| `i18next` | 20,2M | v26.3.6 — 09/07/2026 ✅ | Motor dominante, porém orientado a front-end; no back-end exige middleware Express cru |
| `i18next-http-middleware` | 274K | v3.9.8 — 28/07/2026 ✅ | Resolve o `Accept-Language`, mas sem DI e sem integração com o ciclo do Nest |
| `intl-messageformat` | 17,5M | v11.2.12 ✅ | Primitiva ICU (plural/gênero/select) — complementar, não substituto |
| `@lingui/core` | 1,35M | v6.6.0 ✅ | DX excelente, mas depende de macros Babel/SWC — atrito com o build padrão do Nest |
| `i18n` (node-i18n) | 504K | v0.15.3 ✅ | API estilo gettext, sem tipagem, sem Nest |
| `node-polyglot` | 302K | v2.6.0 — 07/2024 ⚠️ | Minimalista, sem negociação de idioma |
| `typesafe-i18n` | 50K | v5.27.1 — 02/2026 ⚠️ | Type-safety boa, adoção baixa; o `nestjs-i18n` já gera tipos |
| `accept-language-parser` | 718K | **2018** 🔴 | Abandonado. Se precisar da primitiva, use `negotiator` (185M, mantido) |
| `zod-i18n-map` | 152K | **01/2024** 🔴 | **Obsoleto** — feito para Zod 3; o Zod 4 resolveu nativamente (10.4) |
| `nestjs-i18next` | **74** | 2022 🔴 | Morto. Não confundir com `nestjs-i18n` |

---

### 10.4 Atrito com a stack de validação — e a solução do Zod 4

🟠 **Sétimo ponto de atrito do relatório.**

O `nestjs-i18n` declara **peer dependency de `class-validator`** (verificado no `package.json` publicado). Seus utilitários de validação — `I18nValidationPipe`, `i18nValidationMessage`, `I18nValidationExceptionFilter` — são construídos sobre o class-validator, **descartado pela Opção B** em favor de Zod + `nestjs-zod`.

Consequência: o `nestjs-i18n` é usado para mensagens de **domínio e negócio**, mas **não** para as mensagens de **validação de schema**.

**A lacuna é coberta nativamente pelo Zod 4.** Verificado em `zod@4.4.3`, que embarca **52 locales**:

```
z.config(z.locales.pt())  →  "Muito pequeno: esperado que string tivesse >=5 caracteres"
z.config(z.locales.es())  →  "Demasiado pequeño: se esperaba que texto tuviera >=5 caracteres"
z.config(z.locales.en())  →  "Too small: expected string to have >=5 characters"
```

🔴 **Armadilha crítica:** `z.config()` é **global e de processo**. Invocá-lo por request cria condição de corrida — requisições `pt-BR` e `es` concorrentes sobrescrevem a cultura uma da outra. É o equivalente exato de atribuir `CultureInfo.DefaultThreadCurrentUICulture` a cada request no .NET.

✅ **Solução verificada** — override por operação, sem estado global:

```ts
schema.safeParse(data, { error: z.locales.pt().localeError })
```

Testado: com a configuração global em `en`, o parse individual retornou português e o parse seguinte voltou a inglês. Este override vive dentro do pipe do `nestjs-zod`, lendo o idioma do contexto do request.

**Decisão:** `z.config()` **apenas no bootstrap**, para definir o fallback. Por request, exclusivamente `localeError`.

---

### 10.5 Mensagens de erro de domínio — duas variantes

A questão de projeto: o `Domain` devolve **chave** ou **texto já traduzido**?

#### Variante 1 — chave pura

```ts
export class DomainError {
  private constructor(
    readonly key: string,                        // 'person.firstName.required'
    readonly args: Record<string, unknown> = {},
    readonly field?: string,
  ) {}
}
```

O `Domain` não importa Nest, i18n nem Zod. A tradução ocorre **somente** no `ExceptionFilter`/controller, via `I18nContext.current()`.

| Prós | Contras |
|---|---|
| Camada de domínio 100% pura e sem dependências | Toda borda precisa lembrar de traduzir |
| Teste unitário assevera chave — tradução nova nunca quebra teste | Jobs e workers precisam de tratamento próprio |
| Log agrupa métrica por código, independente do idioma | Consumidor interno (outro serviço) recebe chave crua |

#### Variante 2 — texto resolvido por contexto ambiente

Reproduz o mecanismo do .NET: `CultureInfo.CurrentUICulture` é um `AsyncLocal<T>` que flui pela cadeia `async/await`, permitindo que o acessor estático do `.resx` resolva o idioma no fundo do domínio sem injeção alguma. **O Node possui a mesma primitiva: `AsyncLocalStorage`** — e é sobre ela que o `I18nContext.current()` é implementado.

```ts
const als = new AsyncLocalStorage<{ lang: string }>();

export const CurrentCulture = {
  run<T>(lang: string, fn: () => T): T { return als.run({ lang }, fn); },
  get lang(): string { return als.getStore()?.lang ?? FALLBACK; },
};
```

```ts
export class DomainError {
  readonly message: string;                      // texto já traduzido
  private constructor(readonly key: string, readonly args = {}, readonly field?: string) {
    this.message = t(key, args);                 // resolvido na criação
    Object.freeze(this);
  }
  toJSON() { return { field: this.field, code: this.key, message: this.message }; }
}
```

O Value Object **não muda**: continua `private constructor` + `static create()` devolvendo `Result`.

#### Anti-padrão descartado

Variável global de módulo (`let currentLang`) para guardar o idioma. Ensaio com três requisições concorrentes e `await` intercalado produziu **2 de 3 respostas no idioma errado** — a última atribuição vence e contamina as demais. Em produção, manifesta-se como defeito intermitente e não reproduzível. **Proibido no template.**

#### Validação de concorrência da Variante 2

Ensaio com **6 requisições concorrentes** (atrasos 30/5/20/15/1/10 ms) e verificação do idioma **antes e depois de cada `await`** dentro da execução do domínio:

```
✅ pt-BR | O primeiro nome é obrigatório.
✅ es    | El nombre es obligatorio.
✅ en    | First name is required.
✅ es    | El nombre es obligatorio.
✅ pt-BR | O primeiro nome é obrigatório.
✅ en    | First name is required.
→ vazamento de idioma entre requisições: NENHUM
```

Fora de contexto de request (job BullMQ) e para idioma sem catálogo (`fr`), houve degradação correta para o `fallbackLanguage`.

---

### 10.6 Decisão — modelo híbrido

**Adotar a Variante 2 acrescida da preservação da chave.** O `DomainError` transporta `key` **e** `message`; o custo é nulo e cada consumidor usa o que lhe serve:

| Consumidor | Campo | Justificativa |
|---|---|---|
| Front-end / integração entre serviços | `code` | Automação não pode depender de string traduzida |
| Usuário final | `message` | Já resolvido, sem trabalho adicional na borda |
| Log e observabilidade | `code` | Agrupa métrica de erro independentemente do idioma |
| Teste unitário | `code` | Novo idioma ou revisão de texto não quebra suíte |

Contrato de resposta do template:

```json
{ "errors": [ { "field": "firstName",
                "code": "person.firstName.required",
                "message": "El nombre es obligatorio." } ] }
```

**Cascata de resolvers** (o primeiro que resolver vence):

```
QueryResolver(['lang'])  →  HeaderResolver(['x-lang'])
  →  AcceptLanguageResolver  →  fallbackLanguage: 'pt-BR'
```

---

### 10.7 Fronteiras de validação e de idioma

| Camada | Valida | Ferramenta | Idioma resolvido por | HTTP |
|---|---|---|---|---|
| Borda HTTP | Forma: campo presente, tipo correto, JSON válido | `nestjs-zod` | `localeError` do Zod 4, por parse | 400 |
| **Domain** (VO / agregado) | **Regra de negócio**: dígito verificador, faixa, duplicidade, limite do agregado | `Result` + `DomainError` | `AsyncLocalStorage` | 422 |
| Application (handler) | Consistência com estado persistido | Query + `Result` | idem | 409 |

⚠️ **Não duplicar regra.** Se o comprimento máximo está no Value Object, o schema Zod não deve repetir `.max(50)` — deve importar a constante (`z.string().max(FirstNameValue.MaxLength)`). Regra duplicada diverge na primeira alteração.

---

### 10.8 Ressalvas de implementação

| # | Ressalva | Mitigação |
|---|---|---|
| 1 | `Domain` passa a depender de `cross-cutting` para o `t()` | Depender de **interface local** (`Translator`), com implementação injetada no bootstrap — preserva a regra de camadas do Nx |
| 2 | `DomainError` em `static readonly` ou memoizado **congela** o idioma do primeiro request | Sempre construir por chamada; proibir cache de instância de erro |
| 3 | Saída do contexto `AsyncLocalStorage` — `setTimeout`, `EventEmitter` registrado fora, callbacks de lib nativa | Fluxos `async/await` e `Promise` preservam o store (verificado). Nos demais, capturar `lang` explicitamente |
| 4 | Jobs BullMQ e consumidores SQS não possuem `Accept-Language` | Persistir `lang` no payload da mensagem e abrir `CurrentCulture.run()` no processor |
| 5 | Chave de tradução inexistente passando silenciosamente | `typesSafeOutputPath` ligado — quebra o build (garantia ausente nos `.resx` da origem) |

---

## 11. Arquitetura alvo

### 11.1 Estrutura de diretórios

```
apps/
  api/                                  # ← src/Api (composition root)
    src/
      main.ts                           # ← Program.cs
      app.module.ts
      controllers/                      # vazio, proposital (como na origem)
      config/
        cors.setup.ts                   # ← CorsPolicyExtension.cs
        versioning.setup.ts             # ← VersioningExtension.cs
        scalar.setup.ts                 # ← ScalarExtension.cs  → /documentation
        health.module.ts                # ← HealthCheckExtension.cs → /_healthcheck/status
        migrations.setup.ts             # ← MigrationExtensions.cs (skip em local)
        options.ts                      # ← OptionsExtension.cs
libs/
  application/                          # ← src/Application
    src/
      application.module.ts
      features/
        assets/
          commands/
            create-asset.command.ts
            create-asset.handler.ts
          queries/
            check-if-exists-asset.query.ts
            check-if-exists-asset.handler.ts
          schemas/
            create-asset.schema.ts      # ← CreateAssetValidator.cs
      dispatchers/
        logging/log.dispatcher.ts
  cross-cutting/                        # ← src/CrossCutting
    src/
      behaviors/
        pipeline-command.bus.ts         # ← ValidatorPipelineBehavior
        exception.mapper.ts             # ← ExceptionPipelineBehavior
        all-exceptions.filter.ts
  domain/                               # ← src/Domain
    src/
      seedwork/
        base-entity.ts                  # ← EntityUlidInt32
      models/people/people-aggregate/
        entities/
          person.entity.ts
          document.entity.ts
        value-objects/
          person/{first-name,middle-name,last-name}.value.ts
          document/{value,issuer}.value.ts
  persistence/                          # ← src/Persistence
    src/
      persistence.module.ts
      context/
        read.orm.config.ts              # ← ReadDataContext
        write.orm.config.ts             # ← WriteDataContext
      mappings/people/
        person.mapping.ts               # ← PersonMapping.cs (EntitySchema)
        document.mapping.ts             # ← DocumentMapping.cs
      migrations/
  anti-corruption/                      # ← src/AntiCorruption
    src/
      anti-corruption.module.ts
      services/iatec/log.service.ts
  message-queue/                        # ← src/MessageQueue (agora implementada)
    src/
      message-queue.module.ts
      jobs/                             # ← Hangfire
        bullmq.config.ts
        queues.ts                       # registro de filas
        processors/                     # @Processor / @Process
        bull-board.setup.ts             # dashboard (≈ painel do Hangfire)
      messaging/                        # ← MassTransit (transporte)
        sns/sns.publisher.ts            # @aws-sdk/client-sns
        sqs/sqs.consumer.ts             # sqs-consumer → CommandBus
        sqs/sqs.producer.ts             # sqs-producer
      outbox/                           # ← MassTransit Outbox
        outbox.entity.ts
        outbox-relay.processor.ts       # job recorrente do BullMQ
docker/
  Dockerfile
  Local.Dockerfile
  docker-compose.yml                    # postgres + redis + localstack
secrets/
  secrets.yml
```

### 11.2 Fluxo de uma requisição

```
HTTP  →  Controller (@nestjs/swagger docs, versionado)
      →  ZodValidationPipe            (validação do payload de entrada)
      →  PipelineCommandBus.execute()
           ├─ ValidatorBehavior       (schema Zod do comando)   ← ValidatorPipelineBehavior
           └─ ExceptionBehavior       (mapeia erro → Result)    ← ExceptionPipelineBehavior
      →  CommandHandler               (retorna Result<T> — neverthrow)
      →  EntityManager (write)        (Unit of Work / flush)
      →  Controller mapeia Result → HTTP status
      →  AllExceptionsFilter          (rede de segurança)
```

**Fluxo assíncrono (Seção 8):**

```
CommandHandler
      →  persiste agregado + registro na tabela `outbox`   (mesma transação)
      →  commit
OutboxRelay (job recorrente BullMQ)
      →  lê outbox → publica no SNS  ou  enfileira no BullMQ
      →  marca como publicada
Consumo
      SQS  → sqs-consumer → CommandBus → handler (idempotente por ULID)
             falha → retry → DLQ (RedrivePolicy)
      Job  → @Processor BullMQ → retry/backoff → failed (visível no bull-board)
```

### 11.3 Equivalência de comandos de desenvolvimento

| Ação | .NET | NestJS (Opção B) |
|---|---|---|
| Restaurar deps | `dotnet restore` | `pnpm install` |
| Build | `dotnet build` | `pnpm build` |
| Executar local | `dotnet run --project src/Api` | `pnpm start:dev` |
| Testes | `dotnet test` | `pnpm test` |
| Teste filtrado | `dotnet test --filter "…~MyTest"` | `pnpm test -t "MyTest"` |
| Criar migration | `dotnet ef migrations add <Nome> --context WriteDataContext` | `pnpm mikro-orm migration:create --name <Nome>` |
| Aplicar migration | `dotnet ef database update` | `pnpm mikro-orm migration:up` |
| Lint | (inexistente) | `pnpm lint` |

---

## 12. Riscos da Opção B e mitigações

| # | Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|---|
| 1 | **Curva de aprendizado.** Quatro bibliotecas de nicho simultâneas (MikroORM, Zod+nestjs-zod, @nestjs/cqrs, neverthrow) para devs vindos de Nest CRUD. | Alta | Alto | `AGENTS.md` + `README.md` do template com uma feature de referência **completamente implementada** (não stub, ao contrário da origem), servindo de exemplo copiável. |
| 2 | **Contratação/rotatividade.** Perfil Nest de mercado majoritariamente não domina CQRS + DDD. | Média | Médio | O time já domina os conceitos em .NET; a transferência é de sintaxe, não de paradigma. Documentar o mapa da Seção 6 como material de onboarding. |
| 3 | **Manutenção do `@nestjs/cqrs`.** Baixa penetração (3,4%). | Baixa | Alto | Pacote **oficial** da equipe Nest, versionado junto com o framework major. Risco real reduzido; o `PipelineCommandBus` isola o acoplamento em um único arquivo. |
| 4 | **Manutenção do MikroORM.** ~7% de penetração. | Baixa | Alto | Projeto maduro, mantenedor ativo, releases frequentes. O padrão `EntitySchema` mantém as entidades de domínio **livres de decorators do ORM**, viabilizando troca de ORM sem tocar no `Domain`. |
| 5 | **Código de infraestrutura próprio** (pipeline bus, extractor de versão, `ReportApiVersions`). | Alta | Baixo | Volume estimado < 200 linhas, concentrado em `cross-cutting`. Cobrir com testes unitários. |
| 6 | **Divergência entre o template .NET e o NestJS ao longo do tempo.** | Alta | Médio | Manter `CHANGELOG.md` espelhado e uma seção "Paridade com o template .NET vX.Y.Z" no README, revisada a cada major. |
| 7 | **Replicação dos passivos da origem** (Seção 3.5). | Média | Alto | Checklist da Seção 13 — os 13 achados **não** devem ser portados. |
| 8 | **Resiliência configurada mas nunca exercida** — mesma armadilha do achado #12 da origem. | Média | Médio | Teste de integração com Testcontainers derrubando o serviço externo, validando abertura do breaker; eventos `onBreak`/`onRetry` logados via `nestjs-pino`. |
| 9 | **Amplificação de carga em incidente** — retry no código somado a redelivery da fila. | Média | Alto | Regra explícita da Seção 9.6: resiliência de mensageria na infraestrutura, de HTTP no código. Nunca nas duas. |
| 10 | **Vazamento de idioma entre requisições concorrentes** — uso de estado global (`z.config()` por request ou variável de módulo). | Média | Alto | Proibição explícita no template (Seção 10.5); `AsyncLocalStorage` como único mecanismo; teste de concorrência na suíte de integração. |
| 11 | **Localização configurada mas nunca ativada** — repetição dos achados #12 e #13 da origem. | Média | Médio | Teste E2E enviando `Accept-Language: es` e asseverando a mensagem traduzida, executado no CI. |

---

## 13. Checklist de criação do template

### 13.1 Correções obrigatórias (não replicar a origem)

- [ ] Connection string montada corretamente, com validação Zod no boot (achado #1)
- [ ] `Dockerfile` e `Local.Dockerfile` **efetivamente escritos** (achado #2)
- [ ] Log de dados sensíveis desabilitado por padrão, habilitado apenas em `local` (achado #3)
- [ ] CORS restritivo por padrão, com allowlist via env (achado #4)
- [ ] Módulo de autenticação previsto/documentado, ainda que opcional (achado #5)
- [ ] Todas as seções de configuração presentes e validadas no bootstrap (achado #6)
- [ ] `secrets.yml` com todas as chaves declaradas (achado #7)
- [ ] Nomes de pastas sem typos (achado #8)
- [ ] Nenhum placeholder `{API_NAME}` remanescente após o script de clonagem (achado #9)
- [ ] ESLint + Prettier configurados e passando (achado #10)
- [ ] Workflow de CI (`build` + `lint` + `test`) no `.github/workflows/` (achado #11)

### 13.2 Paridade a validar

- [ ] Porta 5015 e rota `/documentation` funcionais
- [ ] `/_healthcheck/status` retornando a versão da aplicação
- [ ] `?api-version=1.0` respeitado, com default assumido
- [ ] Migração automática **pulada** quando `NODE_ENV=local`
- [ ] Identificadores de banco em `snake_case`
- [ ] Schema `people`, tabelas `person` e `document`
- [ ] `externalId` como `char(26)` ULID
- [ ] Behaviors executando na ordem validação → exceção
- [ ] Handlers retornando `Result` (nunca lançando para controle de fluxo)
- [ ] Regras de dependência entre camadas falhando o build quando violadas
- [ ] Política de resiliência **efetivamente aplicada** a todo cliente HTTP externo — corrigindo o achado #12
- [ ] Abertura do circuit breaker gerando log estruturado (`onBreak`/`onReset`), nunca falha silenciosa
- [ ] Retry **ausente** nos consumidores SQS (redelivery é responsabilidade da fila)
- [ ] `Accept-Language: es` retornando mensagem em espanhol — corrigindo o achado #13
- [ ] Idioma sem catálogo degradando para o `fallbackLanguage`, nunca para a chave crua
- [ ] Teste de concorrência provando ausência de vazamento de idioma entre requisições
- [ ] Erro de resposta contendo **`code` e `message`** simultaneamente
- [ ] `typesSafeOutputPath` ativo: chave de tradução inexistente quebra o build
- [ ] Jobs BullMQ carregando `lang` no payload

### 13.3 Renomeação ao clonar (equivalente ao checklist do `AGENTS.md`)

- [ ] `name` e `version` do `package.json` (iniciar em `1.0.0`)
- [ ] Título e descrição no `scalar.setup.ts`
- [ ] Nome do banco na configuração
- [ ] Schema e tabelas nos `EntitySchema`
- [ ] Placeholders do `secrets.yml`
- [ ] `README.md` e `AGENTS.md`

---

## 14. Roadmap sugerido

| Fase | Entrega | Critério de aceite |
|---|---|---|
| **0 — Fundação** | Workspace Nx, libs por camada, ESLint/Prettier, regras de dependência | Violação de camada quebra o build |
| **1 — Config & Bootstrap** | `main.ts`, `AppModule`, `@nestjs/config` + validação Zod, `nestjs-pino` | App sobe na 5015; config inválida falha no boot com mensagem clara |
| **2 — Infra HTTP** | CORS, versionamento, Swagger + Scalar, Terminus | `/documentation` e `/_healthcheck/status` respondendo |
| **3 — Persistência** | MikroORM read/write, `EntitySchema`, snake_case, migration `Init` | Migration cria `people.person` e `people.document` |
| **4 — Domínio & i18n** | `BaseEntity` (ULID), agregado `People`, VOs **com validação** (a origem declara `FieldMinLength`/`FieldMaxLength` e **não os utiliza**), `nestjs-i18n` + `AcceptLanguageResolver`, `DomainError` híbrido (`code` + `message`) | Testes de VO e agregado passando; `Accept-Language: es` retornando mensagem traduzida; teste de concorrência sem vazamento de idioma |
| **5 — CQRS & Behaviors** | `PipelineCommandBus`, validação Zod, mapeamento de exceções, `neverthrow` | Comando inválido barrado no bus, fora do ciclo HTTP |
| **6 — Anti-Corruption & Resiliência** | `LogService` via `@nestjs/axios`, `LogDispatcher`, `ResilientHttpModule` com `cockatiel` (retry + breaker + timeout) | Falha do serviço externo não derruba o request; breaker abre sob falha reiterada e o evento aparece no log estruturado |
| **7 — Feature de referência** | `Assets` **completa** (controller + command + query + schema + testes) | Serve de exemplo copiável — corrige o principal defeito da origem |
| **8 — Jobs (BullMQ)** | `bullmq` + `@nestjs/bullmq`, filas, processors, job recorrente, `@bull-board` | Job com retry/backoff visível no dashboard; recorrente não duplica com N réplicas |
| **9 — Mensageria (SNS/SQS)** | Publisher SNS, `sqs-consumer` → `CommandBus`, DLQ em IaC | Mensagem consumida idempotentemente; falha reiterada cai na DLQ |
| **10 — Outbox** | Tabela `outbox` + relay recorrente no BullMQ | Rollback da transação **não** publica mensagem |
| **11 — Empacotamento & CI** | Dockerfiles, `docker-compose` (postgres+redis+localstack), `secrets.yml`, CI | Imagem builda e sobe; CI verde com testes LocalStack |
| **12 — Documentação** | `README.md`, `AGENTS.md`, `CHANGELOG.md` (v1.0.0) | Mapa de paridade da Seção 6 incluído no onboarding |

---

## 15. Conclusão

A **Opção B é viável e recomendada para este contexto específico**, com paridade arquitetural de ≈80% total (41 de 51 padrões) e ≈92% considerando as paridades parciais aceitáveis (47 de 51).

A justificativa central para não seguir a stack mais popular é que **o objetivo do artefato é ser um template padronizado de organização**, cujo valor está justamente na consistência com o padrão .NET já adotado internamente. Optar pelo mainstream (Prisma + class-validator + services CRUD) produziria um template *bom em NestJS* porém *arquiteturalmente divergente* do restante do parque de APIs — anulando o propósito de padronização.

O único ponto que exige investimento próprio de engenharia é o **pipeline de behaviors sobre o `CommandBus`** (Seção 7.1), estimado em menos de 60 linhas e isolado em uma única lib.

Recomenda-se, adicionalmente, **corrigir na origem os 13 achados da Seção 3.5** — em especial o bug crítico da connection string — antes ou em paralelo à criação do template NestJS.

---

### Anexo A — Bibliotecas descartadas e motivos

| Biblioteca | Categoria | Motivo do descarte |
|---|---|---|
| Prisma | ORM | Modelo anêmico gerado por schema; incompatível com Value Objects, construtores privados e Unit of Work |
| Drizzle | ORM | Query builder tipado, sem Unit of Work nem Identity Map; excelente para CRUD, inadequado para DDD |
| TypeORM | ORM | Viável (2ª opção), mas com `@Embedded` menos maduro e sem Identity Map real |
| class-validator | Validação | Acopla regras ao DTO; perde o padrão "validator em classe separada" do FluentValidation |
| Joi | Validação | Sem inferência de tipos TypeScript (Zod infere o tipo a partir do schema) |
| ts-results | Result type | Adoção residual (~2%) frente ao neverthrow |
| Interceptors do Nest (para behaviors) | Pipeline | Limitados ao ciclo HTTP; não cobrem despachos de comando fora dele |
| Vitest | Testes | Jest permanece o default do Nest CLI; migração pode ser avaliada posteriormente |
| winston | Log | `nestjs-pino` oferece melhor performance e integração nativa com o ciclo de request do Nest |
| pg-boss | Jobs | Menor adoção (1,13M vs 7,57M do BullMQ), sem dashboard e sem módulo Nest oficial. Vantagem de outbox nativo não compensa a perda de paridade com o painel do Hangfire |
| graphile-worker | Jobs | Adoção residual (~3%), API de baixo nível, sem UI |
| `@nestjs/schedule` | Jobs | Só cron em memória: sem persistência, sem retry e **sem lock distribuído** (duplica execução em múltiplas réplicas). Aceitável apenas para tarefas locais triviais |
| bull (legado) | Jobs | Substituído pelo BullMQ pelo mesmo mantenedor |
| agenda | Jobs | Exige MongoDB — fora da stack |
| inngest / trigger.dev | Jobs | SaaS: dado sai da infraestrutura e gera custo recorrente |
| croner / node-cron | Jobs | São parsers de cron, não executores de job |
| `aws-sdk` v2 | AWS | Fim de suporte; volume de download alto apenas por legado |
| `@ssut/nestjs-sqs` | SQS | Única integração Nest viável, mas ~18 meses sem release. Substituída por `sqs-consumer` direto (~20 linhas) |
| `@nestjs-packages/sqs` | SQS | Morto — último release em 2022, peer deps travadas no Nest 9 |
| squiss-ts / sqs-queue-parallel | SQS | Adoção residual (< 4k DL/sem), sem manutenção |
| `@nestjs/microservices` | Mensageria | **Não possui transporte SQS oficial**; exigiria `CustomTransportStrategy` própria sem ganho |
| `@golevelup/nestjs-rabbitmq` | Mensageria | Excelente para RabbitMQ, mas a stack definida é SNS/SQS |
| `@nestjs/cqrs` Sagas | Saga | Process manager RxJS **em memória** — não é durável, não substitui State Machine do MassTransit |
| Temporal / Step Functions | Saga | Não descartados: **adiar** até existir uma saga real. Não subir preventivamente |
| moleculer | Microsserviços | Framework concorrente do Nest; não compõe |
| `nestjs-resilience` | Resiliência | Adoção residual (6,7K DL/sem ≈ 0,05% de penetração), mantenedor único, sem release desde 03/2025. Envolver o `cockatiel` diretamente custa menos que depender dele |
| `p-retry` | Resiliência | Excelente, mas cobre só retry; **ESM-only**, gerando atrito com o build CJS padrão do Nest |
| `async-retry` / `ts-retry-promise` / `exponential-backoff` | Resiliência | Parciais (só retry/backoff); exigiriam compor com outra lib para breaker e bulkhead |
| `axios-retry` | Resiliência | Sem release desde 08/2024; resolve só retry e amarra a política ao axios |
| `bottleneck` | Resiliência | Sem manutenção desde 2019; volume de download por legado |
| `polly-js` | Resiliência | Homônimo enganoso — **não** é porte do Polly .NET; cobre apenas retry |
| `brakes` / `hystrixjs` / `circuit-breaker-js` | Resiliência | Abandonados (< 7K DL/sem) |
| `zod-i18n-map` | i18n | Obsoleto — construído para Zod 3; o Zod 4 embarca 52 locales nativamente |
| `nestjs-i18next` | i18n | Morto: 74 DL/sem, último release em 2022. Não confundir com `nestjs-i18n` |
| `accept-language-parser` | i18n | Sem release desde 2018; parseia o header mas não resolve tradução. Alternativa mantida: `negotiator` |
| `i18next` + `i18next-http-middleware` | i18n | Motor dominante, porém middleware Express cru: sem DI, sem integração com pipes e filters do Nest |
| `@lingui/core` | i18n | Depende de macros Babel/SWC — atrito com o build padrão do Nest CLI |
| `typesafe-i18n` | i18n | Adoção baixa (50K DL/sem); o `nestjs-i18n` já gera tipos via `typesSafeOutputPath` |
| `node-polyglot` / `i18n` (node-i18n) / `rosetta` | i18n | Sem negociação de `Accept-Language` e sem tipagem |
| `class-validator` (mesmo como peer do `nestjs-i18n`) | i18n / Validação | Instalado transitivamente, porém **não utilizado** — a validação permanece em Zod |
| `opossum` | Resiliência | **Não descartado** — admitido como complemento opcional apenas se houver exigência de métricas de breaker no Prometheus |

### Anexo B — Origem dos dados

- Downloads: `https://api.npmjs.org/downloads/point/last-week/<pacote>`, coletados em 28/07/2026 (stack base, jobs e mensageria) e **29/07/2026** (resiliência).
- Versões e datas de release: `https://registry.npmjs.org/<pacote>` (campos `dist-tags.latest` e `time`), consultados em 29/07/2026.
- Verificação de API por instalação real: `nestjs-i18n` 10.8.5, `zod` 4.4.3, `neverthrow` 8.2.0 — resolvers, locales e combinadores conferidos em execução, não por documentação.
- Ensaios de concorrência (`AsyncLocalStorage` vs. variável global) executados sob `tsc --strict` + `tsx`, com 6 requisições concorrentes e `await` intercalado.
- Confirmação da localização na origem: `src/Api/bin/Debug/net10.0/Api.deps.json` (satélites `es` e `pt-BR`) e ausência de `UseRequestLocalization` em `src/Api/Configurations/`.
- Confirmação do Polly na origem: `src/Api/obj/project.assets.json` (grafo de dependências resolvido) e `src/AntiCorruption/Configurations/Extensions/LoggingConfig.cs`.
- Código-fonte: leitura integral do repositório `iatecbr/IATec.Standard.Net.Api.FromLib`, commit `603a249`.
- Metodologia de penetração: `DL(pacote) ÷ DL(@nestjs/core)`, válida apenas para pacotes cujo uso é predominantemente dentro de aplicações NestJS.
