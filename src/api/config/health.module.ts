import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

/**
 * Health check module — equivalent to Api.Configurations.Extensions.HealthCheckExtension.
 * Exposes /_healthcheck/status with version info.
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
