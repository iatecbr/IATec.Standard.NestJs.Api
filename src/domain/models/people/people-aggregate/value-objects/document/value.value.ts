import { Result, ok, err } from 'neverthrow';

export class ValueValue {
  static readonly FIELD_MIN_LENGTH = 1;
  static readonly FIELD_MAX_LENGTH = 150;

  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Result<ValueValue, string> {
    if (!value || value.length < ValueValue.FIELD_MIN_LENGTH) {
      return err(`Document value must be at least ${ValueValue.FIELD_MIN_LENGTH} character(s).`);
    }
    if (value.length > ValueValue.FIELD_MAX_LENGTH) {
      return err(`Document value must be at most ${ValueValue.FIELD_MAX_LENGTH} characters.`);
    }
    return ok(new ValueValue(value));
  }
}
