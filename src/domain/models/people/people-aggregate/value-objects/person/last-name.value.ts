import { Result, ok, err } from 'neverthrow';

export class LastNameValue {
  static readonly FIELD_MIN_LENGTH = 1;
  static readonly FIELD_MAX_LENGTH = 50;

  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Result<LastNameValue, string> {
    if (!value || value.length < LastNameValue.FIELD_MIN_LENGTH) {
      return err(`Last name must be at least ${LastNameValue.FIELD_MIN_LENGTH} character(s).`);
    }
    if (value.length > LastNameValue.FIELD_MAX_LENGTH) {
      return err(`Last name must be at most ${LastNameValue.FIELD_MAX_LENGTH} characters.`);
    }
    return ok(new LastNameValue(value));
  }
}
