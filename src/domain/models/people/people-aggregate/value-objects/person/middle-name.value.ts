import { Result, ok, err } from 'neverthrow';

export class MiddleNameValue {
  static readonly FIELD_MIN_LENGTH = 1;
  static readonly FIELD_MAX_LENGTH = 50;

  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Result<MiddleNameValue, string> {
    if (!value || value.length < MiddleNameValue.FIELD_MIN_LENGTH) {
      return err(`Middle name must be at least ${MiddleNameValue.FIELD_MIN_LENGTH} character(s).`);
    }
    if (value.length > MiddleNameValue.FIELD_MAX_LENGTH) {
      return err(`Middle name must be at most ${MiddleNameValue.FIELD_MAX_LENGTH} characters.`);
    }
    return ok(new MiddleNameValue(value));
  }
}
