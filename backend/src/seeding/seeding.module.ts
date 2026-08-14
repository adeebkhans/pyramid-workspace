import { Inject, Injectable, Logger, Module, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { runtimeSettings } from '@pyramid/config';
import { CommentsModule } from '@pyramid/domains/discussions/comments.module';
import { MembersModule } from '@pyramid/domains/members/members.module';
import { ProjectsModule } from '@pyramid/domains/projects/projects.module';
import { LabelsModule } from '@pyramid/domains/taxonomy/labels.module';
import { TasksModule } from '@pyramid/domains/tasks/tasks.module';
import { WorkspaceSeeder } from './workspace.seeder';

/**
 * Runs the seeder once on boot, and only when `SEED_ON_BOOT` says so.
 *
 * Keeping the trigger in its own provider means the seeder itself stays a
 * plain, testable service that the CLI can also call.
 */
@Injectable()
export class SeedOnBootstrap implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedOnBootstrap.name);

  constructor(
    private readonly seeder: WorkspaceSeeder,
    @Inject(runtimeSettings.KEY) private readonly runtime: ConfigType<typeof runtimeSettings>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.runtime.seedOnBoot) return;

    try {
      await this.seeder.run();
    } catch (error) {
      // A failed demo seed must never stop the API from serving.
      this.logger.error(`Seed skipped: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

@Module({
  imports: [MembersModule, ProjectsModule, TasksModule, LabelsModule, CommentsModule],
  providers: [WorkspaceSeeder, SeedOnBootstrap],
  exports: [WorkspaceSeeder],
})
export class SeedingModule {}
