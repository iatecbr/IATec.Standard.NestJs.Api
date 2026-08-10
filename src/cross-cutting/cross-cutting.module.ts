import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PipelineCommandBus } from './behaviors/pipeline-command.bus';

/**
 * CrossCutting module — equivalent to src/CrossCutting.
 * Houses pipeline behaviors and cross-cutting concerns.
 */
@Module({
  imports: [CqrsModule],
  providers: [PipelineCommandBus],
  exports: [PipelineCommandBus],
})
export class CrossCuttingModule {}
