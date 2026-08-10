import { FirstNameValue } from './first-name.value';

describe('FirstNameValue', () => {
  it('should create a valid first name', () => {
    const result = FirstNameValue.create('John');
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.value).toBe('John');
    }
  });

  it('should reject empty first name', () => {
    const result = FirstNameValue.create('');
    expect(result.isErr()).toBe(true);
  });

  it('should reject first name exceeding max length', () => {
    const longName = 'a'.repeat(51);
    const result = FirstNameValue.create(longName);
    expect(result.isErr()).toBe(true);
  });
});
