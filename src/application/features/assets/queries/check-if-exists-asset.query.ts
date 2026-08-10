import { IQuery } from '@nestjs/cqrs';

/**
 * CheckIfExistsAssetQuery — equivalent to Application.Features.Assets.Queries.CheckIfExistsAssetQuery.
 * Implements IQuery (IRequest<Result<bool>> in .NET).
 */
export class CheckIfExistsAssetQuery implements IQuery {
  // Intentionally empty — stub, like the .NET origin
}
