import { INestApplication, VersioningType } from '@nestjs/common';
import { Request } from 'express';

/**
 * API Versioning configuration — equivalent to Api.Configurations.Extensions.VersioningExtension.
 * Uses querystring `?api-version=1.0` (like Asp.Versioning.Mvc).
 *
 * Nest's CUSTOM versioning type allows extracting version from the query string,
 * replicating `QueryStringApiVersionReader("api-version")`.
 */
export function setupVersioning(app: INestApplication): void {
  app.enableVersioning({
    type: VersioningType.CUSTOM,
    extractor: (request: unknown) => {
      const req = request as Request;
      const version = (req.query?.['api-version'] as string) ?? undefined;
      return version ?? '1';
    },
    defaultVersion: '1',
  });
}
