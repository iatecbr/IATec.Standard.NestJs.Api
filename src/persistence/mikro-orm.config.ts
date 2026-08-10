import { defineConfig } from '@mikro-orm/postgresql';
import { PersonSchema } from './mappings/people/person.mapping';
import { DocumentSchema } from './mappings/people/document.mapping';

/**
 * MikroORM CLI configuration — used by `mikro-orm migration:create` etc.
 * Equivalent to the --context WriteDataContext + --startup-project src/Api in the .NET CLI.
 */
export default defineConfig({
  host: process.env.POSTGRES_HOST_WRITER ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  dbName: process.env.POSTGRES_DATABASE ?? 'dbPeople_local',
  user: process.env.POSTGRES_USER ?? 'postgres',
  password: process.env.POSTGRES_PASSWORD ?? '',
  entities: [PersonSchema, DocumentSchema],
  migrations: {
    path: './src/persistence/migrations',
    pathTs: './src/persistence/migrations',
    snapshotName: '.snapshot',
  },
  schemaGenerator: {
    disableForeignKeys: false,
  },
});
