import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';

import { MODEL } from '@pyramid/shared/persistence/schema-options';
import { TERMINAL_WORKFLOW_STATES } from '@pyramid/shared/domain/workflow';
import type { Task } from '@pyramid/domains/tasks/task.schema';

export interface ProjectTaskTally {
  projectId: string;
  total: number;
  completed: number;
}

/**
 * A deliberately narrow read model over the tasks collection.
 *
 * The projects domain needs task counts but has no business mutating tasks, so
 * it gets a read-only collaborator instead of a dependency on `TasksService`.
 * That also keeps the module graph acyclic: tasks may import projects, projects
 * never imports tasks.
 */
@Injectable()
export class ProjectInsightsRepository {
  constructor(@InjectModel(MODEL.task) private readonly tasks: Model<Task>) {}

  /**
   * One aggregation for the whole page of projects rather than N count queries
   * — the difference between 1 round-trip and 40 on a busy workspace.
   */
  async tallyByProject(projectIds: string[]): Promise<Map<string, ProjectTaskTally>> {
    if (projectIds.length === 0) return new Map();

    const completedStates = [...TERMINAL_WORKFLOW_STATES];

    const rows = await this.tasks
      .aggregate<{ _id: Types.ObjectId; total: number; completed: number }>([
        {
          $match: {
            archivedAt: null,
            project: { $in: projectIds.map((id) => new Types.ObjectId(id)) },
          },
        },
        {
          $group: {
            _id: '$project',
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $in: ['$state', completedStates] }, 1, 0] } },
          },
        },
      ])
      .exec();

    return new Map(
      rows.map((row) => [
        String(row._id),
        { projectId: String(row._id), total: row.total, completed: row.completed },
      ]),
    );
  }

  /** Detaches tasks when their project is archived so they do not vanish. */
  async detachTasks(projectId: string): Promise<number> {
    const outcome = await this.tasks.updateMany({ project: projectId }, { $set: { project: null } }).exec();
    return outcome.modifiedCount ?? 0;
  }
}
