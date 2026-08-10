import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Result, err } from 'neverthrow';
import { CheckIfExistsAssetQuery } from './check-if-exists-asset.query';

/**
 * CheckIfExistsAssetQueryHandler — equivalent to Application.Features.Assets.Queries.CheckIfExistsAssetQueryHandler.
 * Intentionally throws NotImplemented — stub, like the .NET origin.
 */
@QueryHandler(CheckIfExistsAssetQuery)
export class CheckIfExistsAssetHandler implements IQueryHandler<CheckIfExistsAssetQuery> {
  async execute(_query: CheckIfExistsAssetQuery): Promise<Result<boolean, unknown>> {
    // TODO: Implement
    return err({ type: 'NOT_IMPLEMENTED', message: 'CheckIfExistsAssetHandler not implemented' });
  }
}
