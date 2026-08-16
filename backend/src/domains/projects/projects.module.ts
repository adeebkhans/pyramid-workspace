import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { TaskSchema } from '@pyramid/domains/tasks/task.schema';
import { MODEL } from '@pyramid/shared/persistence/schema-options';
import { ProjectInsightsRepository } from './project-insights.repository';
import { ProjectRepository } from './project.repository';
import { ProjectSchema } from './project.schema';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

/**
 * Registers the task model read-only so project progress can be aggregated
 * without importing `TasksModule` — see `ProjectInsightsRepository` for why the
 * dependency runs in this direction.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MODEL.project, schema: ProjectSchema },
      { name: MODEL.task, schema: TaskSchema },
    ]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectRepository, ProjectInsightsRepository, ProjectsService],
  exports: [ProjectsService, ProjectRepository],
})
export class ProjectsModule {}
