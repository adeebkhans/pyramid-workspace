import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { ApplicationModule } from '@pyramid/application.module';
import { WorkspaceSeeder } from './workspace.seeder';

/**
 * Standalone entry point: `npm run seed [-- --force]`.
 *
 * Creating an application *context* rather than an HTTP server gives the script
 * the full dependency-injection graph without binding a port — the same
 * services the API uses, no duplicated wiring.
 */
async function main(): Promise<void> {
  const logger = new Logger('SeedCLI');
  const force = process.argv.includes('--force');

  // The CLI drives the seeder explicitly; the boot-time hook would double-run it.
  process.env.SEED_ON_BOOT = 'false';

  const context = await NestFactory.createApplicationContext(ApplicationModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const report = await context.get(WorkspaceSeeder).run({ force });

    if (report.skipped) {
      logger.warn('Database already contains a workspace. Re-run with --force to replace it.');
    } else {
      logger.log(
        `Seeded ${report.members} members, ${report.labels} labels, ${report.projects} projects, ` +
          `${report.tasks} tasks and ${report.comments} comments.`,
      );
    }
  } finally {
    await context.close();
  }
}

main().catch((error: unknown) => {
  new Logger('SeedCLI').error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
