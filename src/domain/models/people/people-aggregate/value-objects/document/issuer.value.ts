import { Result, ok, err } from 'neverthrow';

export class IssuerValue {
  static readonly FIELD_MIN_LENGTH = 1;
  static readonly FIELD_MAX_LENGTH = 50;

  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Result<IssuerValue, string> {
    if (!value || value.length < IssuerValue.FIELD_MIN_LENGTH) {
      return err(`Issuer must be at least ${IssuerValue.FIELD_MIN_LENGTH} character(s).`);
    }
    if (value.length > IssuerValue.FIELD_MAX_LENGTH) {
      return err(`Issuer must be at most ${IssuerValue.FIELD_MAX_LENGTH} characters.`);
    }
    return ok(new IssuerValue(value));
  }
}
