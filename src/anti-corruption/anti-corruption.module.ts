import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LogService } from './services/iatec/log.service';
import { LOG_SERVICE } from './services/iatec/log-service.token';

/**
 * AntiCorruption module — equivalent to AntiCorruption.Configurations.AntiCorruptionDependencyInjectionConfig.
 * Isolates external service integrations (typed HttpClient for IATec Log Service).
 */
@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('LOG_SERVICE_URL', '');
        return {
          baseURL: url,
          timeout: 5000,
        };
      },
    }),
  ],
  providers: [
    {
      provide: LOG_SERVICE,
      useClass: LogService,
    },
  ],
  exports: [LOG_SERVICE],
})
export class AntiCorruptionModule {}
