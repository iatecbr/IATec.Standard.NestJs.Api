import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './api/app.module';
import { AllExceptionsFilter } from '@cross-cutting/behaviors/all-exceptions.filter';
import { setupCors } from './api/config/cors.setup';
import { setupVersioning } from './api/config/versioning.setup';
import { setupScalar } from './api/config/scalar.setup';
import { applyMigrations } from './api/config/migrations.setup';

/**
 * Application bootstrap — equivalent to Program.cs.
 *
 * Pipeline:
 * 1. Create NestFactory with AppModule
 * 2. Configure infrastructure (CORS, versioning, Scalar, migrations)
 * 3. Listen on port 5015
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Structured logging (nestjs-pino)
  app.useLogger(app.get(Logger));

  // Global exception filter — equivalent to ExceptionPipelineBehavior (HTTP level)
  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS — equivalent to UseCors("CorsPolicy")
  setupCors(app);

  // API versioning — equivalent to UseApiVersioning
  setupVersioning(app);

  // OpenAPI + Scalar — equivalent to ConfigureOpenApi + MapScalarApiReference
  const environment = process.env.NODE_ENV ?? 'local';
  setupScalar(app, environment);

  // Auto-migration — skipped in local (same as .NET origin)
  await applyMigrations(app);

  // Start listening
  const port = process.env.APP_PORT ?? 5015;
  await app.listen(port);

  const logger = new (await import('@nestjs/common')).Logger('Bootstrap');
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Environment: ${environment}`);

  if (environment !== 'production') {
    logger.log(`Documentation: http://localhost:${port}/documentation`);
    logger.log(`OpenAPI JSON: http://localhost:${port}/openapi/v1.json`);
  }
}

bootstrap();
