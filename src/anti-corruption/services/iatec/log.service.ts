import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ILogService, LogDto } from './log-service.interface';

/**
 * LogService — typed HTTP client for the IATec Log Service.
 * Equivalent to AntiCorruption.Services.Iatec.LogService.
 * Errors are swallowed (logged) to avoid crashing the main request — same behavior as .NET origin.
 */
@Injectable()
export class LogService implements ILogService {
  private readonly logger = new Logger(LogService.name);

  constructor(private readonly httpService: HttpService) {}

  async send(log: LogDto): Promise<void> {
    try {
      this.logger.log('Sending log to IATec Log Service');
      await firstValueFrom(this.httpService.post('v1/log', log));
      this.logger.log('Log sent to IATec successfully');
    } catch (error) {
      this.logger.error(
        'Error sending log to IATec',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
