import { ICommand } from '@nestjs/cqrs';
import { ValidateWith } from '@cross-cutting/behaviors/validator.decorator';
import { createAssetSchema } from '../schemas/create-asset.schema';

/**
 * CreateAssetCommand — equivalent to Application.Features.Assets.Commands.CreateAssetCommand.
 * Implements ICommand (IRequest<Result> in .NET).
 */
@ValidateWith(createAssetSchema)
export class CreateAssetCommand implements ICommand {
  // Intentionally empty — stub, like the .NET origin
}
