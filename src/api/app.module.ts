import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ApplicationModule } from '@application/application.module';
import { PersistenceModule } from '@persistence/persistence.module';
import { AntiCorruptionModule } from '@anti-corruption/anti-corruption.module';
import { MessageQueueModule } from '@message-queue/message-queue.module';
import { HealthModule } from './config/health.module';
import { VersionHealthIndicator } from './config/health.controller';

/**
 * Root application module — equivalent to Program.cs composition root.
 *
 * Encadeia os módulos das camadas:
 * - ConfigureApi → HealthModule + config
 * - ConfigureApplication → ApplicationModule
 * - ConfigureAntiCorruption → AntiCorruptionModule
 * - ConfigureMessageQueue → MessageQueueModule
 * - ConfigurePersistence → PersistenceModule
 */
@Module({
  imports: [
    // Configuration — equivalent to appsettings.json + IOptions<T>
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),

    // Structured logging — equivalent to ILogger<T> (superior: correlation ids + JSON output)
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV === 'local'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
        level: process.env.LOG_LEVEL ?? 'info',
      },
    }),

    // Health checks — /_healthcheck/status
    HealthModule,

    // Application layer — CQRS handlers, validators, dispatchers
    ApplicationModule,

    // AntiCorruption layer — external service integrations
    AntiCorruptionModule,

    // MessageQueue layer — stub (no-op)
    MessageQueueModule,

    // Persistence layer — MikroORM + PostgreSQL
    PersistenceModule,
  ],
  providers: [VersionHealthIndicator],
})
export class AppModule {}
