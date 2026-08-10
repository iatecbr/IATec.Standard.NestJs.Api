import { EntitySchema } from '@mikro-orm/core';
import { Document } from '@domain/models/people/people-aggregate/entities/document.entity';

/**
 * MikroORM EntitySchema for Document — equivalent to DocumentMapping.cs (IEntityTypeConfiguration<Document>).
 * Declarative mapping keeps the domain entity free of ORM decorators.
 */
export const DocumentSchema = new EntitySchema<Document>({
  class: Document,
  tableName: 'document',
  schema: 'people',
  properties: {
    id: {
      type: 'number',
      primary: true,
      autoincrement: true,
      fieldName: 'id',
    },
    externalId: {
      type: 'string',
      columnType: 'char(26)',
      length: 26,
      nullable: false,
      fieldName: 'external_id',
    },
    personId: {
      type: 'number',
      fieldName: 'person_id',
      nullable: false,
    },
    person: {
      kind: 'm:1',
      entity: 'Person',
      fieldName: 'person_id',
      nullable: true,
    },
    documentValue: {
      type: 'json',
      fieldName: 'value_value',
      columnType: 'varchar(150)',
      nullable: false,
    },
    issuer: {
      type: 'json',
      fieldName: 'issuer_value',
      columnType: 'varchar(50)',
      nullable: false,
    },
  },
});
