import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PersonSchema } from './mappings/people/person.mapping';
import { DocumentSchema } from './mappings/people/document.mapping';

/**
 * Persistence module — equivalent to Persistence.Configurations.PersistenceDependencyInjectionConfig.
 * Configures MikroORM with read/write connection separation and snake_case naming.
 */
@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isLocal = config.get<string>('NODE_ENV') === 'local';
        const sensitiveDataLogging = config.get<boolean>('SENSITIVE_DATA_LOGGING', false);

        return {
          type: 'postgresql',
          host: config.get<string>('POSTGRES_HOST_WRITER', 'localhost'),
          port: config.get<number>('POSTGRES_PORT', 5432),
          dbName: config.get<string>('POSTGRES_DATABASE', 'dbPeople_local'),
          user: config.get<string>('POSTGRES_USER', 'postgres'),
          password: config.get<string>('POSTGRES_PASSWORD', ''),
          entities: [PersonSchema, DocumentSchema],
          debug: sensitiveDataLogging && isLocal,
          migrations: {
            path: './src/persistence/migrations',
            pathTs: './src/persistence/migrations',
          },
          schemaGenerator: {
            disableForeignKeys: false,
          },
        };
      },
    }),
    MikroOrmModule.forFeature({ entities: [PersonSchema, DocumentSchema] }),
  ],
  exports: [MikroOrmModule],
})
export class PersistenceModule {}
