import { ZodSchema } from 'zod';

export const COMMAND_VALIDATOR_METADATA = Symbol('COMMAND_VALIDATOR');

/**
 * Decorator to associate a Zod validation schema with a command class.
 * This is the equivalent of FluentValidation's AbstractValidator<T> registration.
 *
 * Usage:
 * ```ts
 * @ValidateWith(createAssetSchema)
 * export class CreateAssetCommand { ... }
 * ```
 */
export function ValidateWith(schema: ZodSchema): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(COMMAND_VALIDATOR_METADATA, schema, target);
  };
}
