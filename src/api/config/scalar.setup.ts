import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

/**
 * OpenAPI + Scalar documentation — equivalent to Api.Configurations.Extensions.ScalarExtension.
 *
 * - OpenAPI JSON at: /openapi/v1.json
 * - Scalar UI at: /documentation
 * - Hidden in production (guard same as .NET: `!app.Environment.IsProduction()`)
 */
export function setupScalar(app: INestApplication, environment: string): void {
  if (environment === 'production') {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle(process.env.APP_NAME ?? '{API_NAME}')
    .setDescription('API documentation')
    .setVersion('v1')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Serve OpenAPI JSON at /openapi/v1.json
  SwaggerModule.setup('openapi', app, document, {
    jsonDocumentUrl: '/openapi/v1.json',
    customSiteTitle: `${process.env.APP_NAME ?? '{API_NAME}'} - ${environment}`,
  });

  // Serve Scalar UI at /documentation
  app.use(
    '/documentation',
    apiReference({
      spec: {
        content: document,
      },
      theme: 'mars',
    }),
  );
}
