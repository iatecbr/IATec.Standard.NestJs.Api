import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CrossCuttingModule } from '@cross-cutting/cross-cutting.module';
import { CreateAssetHandler } from './features/assets/commands/create-asset.handler';
import { CheckIfExistsAssetHandler } from './features/assets/queries/check-if-exists-asset.handler';
import { LogDispatcher } from './dispatchers/logging/log.dispatcher';
import { LOG_DISPATCHER } from './dispatchers/logging/log-dispatcher.token';

const CommandHandlers = [CreateAssetHandler];
const QueryHandlers = [CheckIfExistsAssetHandler];

/**
 * Application module — equivalent to Application.Configurations.ApplicationDependencyInjectionConfig.
 * Registers MediatR handlers (CQRS), validators, and dispatchers.
 */
@Module({
  imports: [CqrsModule, CrossCuttingModule],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: LOG_DISPATCHER,
      useClass: LogDispatcher,
    },
  ],
  exports: [CqrsModule, CrossCuttingModule, LOG_DISPATCHER],
})
export class ApplicationModule {}
