import { Result, ok, err } from 'neverthrow';

export class FirstNameValue {
  static readonly FIELD_MIN_LENGTH = 1;
  static readonly FIELD_MAX_LENGTH = 50;

  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Result<FirstNameValue, string> {
    if (!value || value.length < FirstNameValue.FIELD_MIN_LENGTH) {
      return err(`First name must be at least ${FirstNameValue.FIELD_MIN_LENGTH} character(s).`);
    }
    if (value.length > FirstNameValue.FIELD_MAX_LENGTH) {
      return err(`First name must be at most ${FirstNameValue.FIELD_MAX_LENGTH} characters.`);
    }
    return ok(new FirstNameValue(value));
  }
}
