import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Publishes interactive API documentation at `<prefix>/docs`.
 *
 * The spec is generated from the DTO decorators the validators already use, so
 * documentation cannot drift from the contract it describes — if a field stops
 * being optional, the docs say so on the next boot.
 */
export function mountOpenApi(app: INestApplication, globalPrefix: string): string {
  const spec = new DocumentBuilder()
    .setTitle('Pyramid API')
    .setDescription(
      [
        'Task and project management for a single workspace.',
        '',
        'List endpoints answer with `{ data, meta }`; single resources are returned bare.',
        'Failures share one envelope: `{ error: { code, message, details }, meta }`.',
      ].join('\n'),
    )
    .setVersion('1.0.0')
    .addTag('members', 'Workspace members, guest sessions and federated identities')
    .addTag('projects', 'Projects and their progress tallies')
    .addTag('tasks', 'Tasks, board placement and embedded checklists')
    .addTag('comments', 'Task discussion threads')
    .addTag('labels', 'Workspace label taxonomy')
    .addTag('activity', 'Per-task audit stream')
    .addTag('health', 'Liveness and readiness probes')
    .build();

  const document = SwaggerModule.createDocument(app, spec);
  const route = `${globalPrefix}/docs`;

  SwaggerModule.setup(route, app, document, {
    customSiteTitle: 'Pyramid API reference',
    swaggerOptions: { persistAuthorization: true, tagsSorter: 'alpha', operationsSorter: 'alpha' },
  });

  return route;
}
