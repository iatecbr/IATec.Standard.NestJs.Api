import { INestApplication, Logger } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';

/**
 * Auto-migration setup — equivalent to Api.Configurations.Extensions.MigrationExtensions.
 * Skips auto-migration when NODE_ENV === 'local' (same behavior as the .NET origin).
 */
export async function applyMigrations(app: INestApplication): Promise<void> {
  const logger = new Logger('Migrations');

  if (process.env.NODE_ENV === 'local') {
    logger.log('Skipping auto-migration in local environment. Run manually: pnpm migration:up');
    return;
  }

  const orm = app.get(MikroORM);
  const migrator = orm.getMigrator();
  const pending = await migrator.getPendingMigrations();

  if (pending.length > 0) {
    logger.log(`Applying ${pending.length} pending migration(s)...`);
    await migrator.up();
    logger.log('Migrations applied successfully.');
  } else {
    logger.log('No pending migrations.');
  }
}
