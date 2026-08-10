import { EntitySchema } from '@mikro-orm/core';
import { Person } from '@domain/models/people/people-aggregate/entities/person.entity';

/**
 * MikroORM EntitySchema for Person — equivalent to PersonMapping.cs (IEntityTypeConfiguration<Person>).
 * Declarative mapping keeps the domain entity free of ORM decorators.
 */
export const PersonSchema = new EntitySchema<Person>({
  class: Person,
  tableName: 'person',
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
    firstName: {
      type: 'json',
      fieldName: 'first_name_value',
      columnType: 'varchar(50)',
      nullable: false,
    },
    middleName: {
      type: 'json',
      fieldName: 'middle_name_value',
      columnType: 'varchar(50)',
      nullable: true,
    },
    lastName: {
      type: 'json',
      fieldName: 'last_name_value',
      columnType: 'varchar(50)',
      nullable: false,
    },
    documents: {
      kind: '1:m',
      entity: 'Document',
      mappedBy: 'person',
    },
  },
});
