import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, ICommand } from '@nestjs/cqrs';
import { Result, err } from 'neverthrow';
import { ZodSchema, ZodError } from 'zod';
import { COMMAND_VALIDATOR_METADATA } from './validator.decorator';

/**
 * Extended CommandBus with pipeline behaviors.
 * Equivalent to ValidatorPipelineBehavior + ExceptionPipelineBehavior from IATec.Shared.Behaviors.
 *
 * Pipeline order:
 * 1. Validation (Zod schema) — equivalent to ValidatorPipelineBehavior<,>
 * 2. Exception mapping — equivalent to ExceptionPipelineBehavior<,>
 *
 * NOTE: This is a standalone service (not extending CommandBus) to avoid private property conflicts.
 * Inject this service and call `executeWithPipeline()` in controllers.
 */
@Injectable()
export class PipelineCommandBus {
  private readonly logger = new Logger(PipelineCommandBus.name);

  constructor(private readonly commandBus: CommandBus) {}

  async executeWithPipeline<T extends ICommand>(command: T): Promise<Result<unknown, unknown>> {
    // 1. Validator Pipeline Behavior
    const schema = this.getValidatorSchema(command);
    if (schema) {
      const result = schema.safeParse(command);
      if (!result.success) {
        const errors = (result.error as ZodError).errors.map((e) => e.message).join('; ');
        this.logger.warn(`Validation failed for ${command.constructor.name}: ${errors}`);
        return err({ type: 'VALIDATION_ERROR', errors: (result.error as ZodError).errors });
      }
    }

    // 2. Exception Pipeline Behavior
    try {
      return await this.commandBus.execute<T>(command);
    } catch (error) {
      this.logger.error(
        `Unhandled exception in handler for ${command.constructor.name}: ${error}`,
      );
      return err({
        type: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  }

  private getValidatorSchema(command: ICommand): ZodSchema | undefined {
    return Reflect.getMetadata(COMMAND_VALIDATOR_METADATA, command.constructor);
  }
}
