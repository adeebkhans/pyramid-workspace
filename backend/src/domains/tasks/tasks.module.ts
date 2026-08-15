import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ProjectsModule } from '@pyramid/domains/projects/projects.module';
import { LabelsModule } from '@pyramid/domains/taxonomy/labels.module';
import { MODEL } from '@pyramid/shared/persistence/schema-options';
import { TaskRepository } from './task.repository';
import { TaskSchema } from './task.schema';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MODEL.task, schema: TaskSchema }]),
    LabelsModule,
    ProjectsModule,
  ],
  controllers: [TasksController],
  providers: [TaskRepository, TasksService],
  exports: [TasksService, TaskRepository],
})
export class TasksModule {}
