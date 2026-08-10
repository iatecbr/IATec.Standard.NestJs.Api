import { BaseEntity } from '@domain/seedwork';
import { ValueValue } from '../value-objects/document/value.value';
import { IssuerValue } from '../value-objects/document/issuer.value';
import type { Person } from './person.entity';

/**
 * Document entity — child of Person aggregate.
 * Equivalent to Domain.Models.People.PeopleAggregate.Entities.Document.
 */
export class Document extends BaseEntity {
  personId!: number;
  person?: Person;
  documentValue!: ValueValue;
  issuer!: IssuerValue;

  private constructor() {
    super();
  }

  static create(personId: number, documentValue: ValueValue, issuer: IssuerValue): Document {
    const doc = new Document();
    doc.personId = personId;
    doc.documentValue = documentValue;
    doc.issuer = issuer;
    return doc;
  }
}
