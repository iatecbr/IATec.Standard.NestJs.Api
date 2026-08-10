import { Person } from './person.entity';
import { FirstNameValue } from '../value-objects/person/first-name.value';
import { LastNameValue } from '../value-objects/person/last-name.value';

describe('Person Entity', () => {
  it('should create a person with valid first and last name', () => {
    const firstName = FirstNameValue.create('John');
    const lastName = LastNameValue.create('Doe');

    expect(firstName.isOk()).toBe(true);
    expect(lastName.isOk()).toBe(true);

    if (firstName.isOk() && lastName.isOk()) {
      const person = Person.create(firstName.value, lastName.value);
      expect(person.firstName.value).toBe('John');
      expect(person.lastName.value).toBe('Doe');
      expect(person.externalId).toHaveLength(26);
    }
  });
});
