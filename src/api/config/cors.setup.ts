import { INestApplication } from '@nestjs/common';

/**
 * CORS configuration — equivalent to Api.Configurations.Extensions.CorsPolicyExtension.
 * Opens all origins for development; restrict before production.
 */
export function setupCors(app: INestApplication): void {
  app.enableCors({
    origin: '*',
    methods: '*',
    allowedHeaders: '*',
    exposedHeaders: ['X-Custom-Header', 'Location', 'Content-Disposition', 'Content-Length'],
  });
}
