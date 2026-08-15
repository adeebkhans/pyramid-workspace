import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type FilterQuery, type Model } from 'mongoose';

import { toSafeRegex } from '@pyramid/shared/http/pagination.query';
import { MongoRepository } from '@pyramid/shared/persistence/mongo.repository';
import { MODEL } from '@pyramid/shared/persistence/schema-options';
import type { PriorityLevel, WorkflowState } from '@pyramid/shared/domain/workflow';
import { BOARD_ORDER_STEP, Task, type TaskDocument } from './task.schema';

export interface TaskFilterCriteria {
  search?: string;
  state?: WorkflowState[];
  priority?: PriorityLevel[];
  projectId?: string;
  assigneeId?: string;
  labelIds?: Types.ObjectId[];
  includeArchived?: boolean;
}

@Injectable()
export class TaskRepository extends MongoRepository<Task> {
  constructor(@InjectModel(MODEL.task) model: Model<Task>) {
    super(model, 'Task');
  }

  buildFilter(criteria: TaskFilterCriteria): FilterQuery<Task> {
    const filter: FilterQuery<Task> = {};

    if (!criteria.includeArchived) filter.archivedAt = null;
    if (criteria.state?.length) filter.state = { $in: criteria.state };
    if (criteria.priority?.length) filter.priority = { $in: criteria.priority };
    if (criteria.projectId) filter.project = criteria.projectId;
    if (criteria.assigneeId) filter.assignee = criteria.assigneeId;
    if (criteria.labelIds?.length) filter.labels = { $in: criteria.labelIds };
    if (criteria.search) filter.title = toSafeRegex(criteria.search);

    return filter;
  }

  /**
   * Next slot at the bottom of a column. Reading one document beats an
   * aggregation, and the sparse step leaves room to insert above it later.
   */
  async nextBoardOrder(state: WorkflowState): Promise<number> {
    const last = await this.model
      .findOne({ state, archivedAt: null })
      .sort({ boardOrder: -1 })
      .select({ boardOrder: 1 })
      .lean()
      .exec();

    return (last?.boardOrder ?? 0) + BOARD_ORDER_STEP;
  }

  /**
   * Rewrites one column's ordering in a single round-trip. `bulkWrite` keeps a
   * 40-card column to one network call rather than 40 sequential updates.
   */
  async applyColumnOrder(state: WorkflowState, orderedIds: string[]): Promise<void> {
    if (orderedIds.length === 0) return;

    await this.model.bulkWrite(
      orderedIds.map((id, index) => ({
        updateOne: {
          filter: { _id: new Types.ObjectId(id) },
          update: { $set: { state, boardOrder: (index + 1) * BOARD_ORDER_STEP } },
        },
      })),
    );
  }

  findByIdWithRelations(id: string, populate: readonly string[]): Promise<TaskDocument | null> {
    return this.findById(id, [...populate]);
  }

  /**
   * Updates one embedded checklist entry in place using a positional array
   * filter, so a subtask edit never has to read-modify-write the whole array
   * (and never clobbers a concurrent edit to a sibling entry).
   */
  async patchChecklistItem(taskId: string, itemId: string, patch: Record<string, unknown>): Promise<void> {
    await this.model
      .updateOne({ _id: taskId }, { $set: patch }, { arrayFilters: [{ 'item._id': new Types.ObjectId(itemId) }] })
      .exec();
  }
}
