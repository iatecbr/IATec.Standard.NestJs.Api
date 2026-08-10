import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ILogDispatcher } from './log-dispatcher.interface';
import { LOG_SERVICE } from '@anti-corruption/services/iatec/log-service.token';
import type { ILogService } from '@anti-corruption/services/iatec/log-service.interface';

/**
 * LogDispatcher — equivalent to Application.Dispatchers.Logging.LogDispatcher.
 * Assembles a log DTO and dispatches it to the IATec Log Service via the anti-corruption layer.
 */
@Injectable()
export class LogDispatcher implements ILogDispatcher {
  constructor(
    @Inject(LOG_SERVICE) private readonly logService: ILogService,
    private readonly config: ConfigService,
  ) {}

  async dispatch(source: string, owner: string, action: string, content?: string): Promise<void> {
    const containerId = this.config.get<string>('CONTAINER_ID', 'ContainerId');

    await this.logService.send({
      containerKey: containerId,
      source,
      owner,
      action,
      content: content ?? '',
      date: new Date().toISOString(),
    });
  }
}
