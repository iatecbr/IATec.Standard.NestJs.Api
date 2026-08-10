import { BaseEntity } from '@domain/seedwork';
import { FirstNameValue } from '../value-objects/person/first-name.value';
import { MiddleNameValue } from '../value-objects/person/middle-name.value';
import { LastNameValue } from '../value-objects/person/last-name.value';
import { Document } from './document.entity';
import { Collection } from '@mikro-orm/core';

/**
 * Person entity — aggregate root of People aggregate.
 * Equivalent to Domain.Models.People.PeopleAggregate.Entities.Person.
 */
export class Person extends BaseEntity {
  firstName!: FirstNameValue;
  middleName?: MiddleNameValue;
  lastName!: LastNameValue;

  readonly documents = new Collection<Document>(this);

  private constructor() {
    super();
  }

  static create(
    firstName: FirstNameValue,
    lastName: LastNameValue,
    middleName?: MiddleNameValue,
  ): Person {
    const person = new Person();
    person.firstName = firstName;
    person.lastName = lastName;
    person.middleName = middleName;
    return person;
  }

  addDocument(document: Document): void {
    this.documents.add(document);
  }
}
