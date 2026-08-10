import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err } from 'neverthrow';
import { CreateAssetCommand } from './create-asset.command';

/**
 * CreateAssetCommandHandler — equivalent to Application.Features.Assets.Commands.CreateAssetCommandHandler.
 * Intentionally throws NotImplemented — stub, like the .NET origin.
 */
@CommandHandler(CreateAssetCommand)
export class CreateAssetHandler implements ICommandHandler<CreateAssetCommand> {
  async execute(_command: CreateAssetCommand): Promise<Result<void, unknown>> {
    // TODO: Implement
    return err({ type: 'NOT_IMPLEMENTED', message: 'CreateAssetHandler not implemented' });
  }
}
