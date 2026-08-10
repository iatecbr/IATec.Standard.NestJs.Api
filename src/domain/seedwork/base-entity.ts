import { ulid } from 'ulid';

/**
 * Base entity with dual identity: int32 Id (internal PK) + char(26) ExternalId (ULID, public).
 * Equivalent to EntityUlidInt32 from IATec.Shared.Domain.
 */
export abstract class BaseEntity {
  readonly id!: number;
  readonly externalId: string;

  protected constructor() {
    this.externalId = ulid();
  }
}
