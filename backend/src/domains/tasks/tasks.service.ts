import { Injectable, Logger } from '@nestjs/common';
import { Types, type UpdateQuery } from 'mongoose';

import { ActivityPublisher } from '@pyramid/domains/activity/activity.recorder';
import { ProjectRepository } from '@pyramid/domains/projects/project.repository';
import { LabelRepository } from '@pyramid/domains/taxonomy/label.repository';
import { LabelsService } from '@pyramid/domains/taxonomy/labels.service';
import { toLabelSlug } from '@pyramid/domains/taxonomy/label.schema';
import { buildCollection, type CollectionResponse } from '@pyramid/shared/http/collection-response';
import { ResourceNotFoundError, UnprocessableRequestError } from '@pyramid/shared/errors/domain.errors';
import { DEFAULT_PRIORITY_LEVEL, DEFAULT_WORKFLOW_STATE } from '@pyramid/shared/domain/workflow';
import { isOverdue } from '@pyramid/shared/utils/calendar';
import type {
  AddChecklistItemDto,
  CreateTaskDto,
  PlaceOnBoardDto,
  TaskQuery,
  UpdateChecklistItemDto,
  UpdateTaskDto,
} from './dto/task.dto';
import { TaskRepository } from './task.repository';
import { TASK_POPULATE_PATHS, TaskView, presentTask } from './task.presenter';
import type { TaskDocument } from './task.schema';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly tasks: TaskRepository,
    private readonly labels: LabelsService,
    private readonly labelStore: LabelRepository,
    private readonly projects: ProjectRepository,
    private readonly activity: ActivityPublisher,
  ) {}

  // ── reads ────────────────────────────────────────────────────────────────

  async list(query: TaskQuery): Promise<CollectionResponse<TaskView>> {
    const labelIds = query.labels?.length ? await this.resolveLabelFilter(query.labels) : undefined;

    const filter = this.tasks.buildFilter({
      search: query.search,
      state: query.state,
      priority: query.priority,
      projectId: query.projectId,
      assigneeId: query.assigneeId,
      includeArchived: query.includeArchived,
      labelIds,
    });

    const [documents, total] = await Promise.all([
      this.tasks.findMany(
        filter,
        { skip: query.skip, limit: query.pageSize, sort: { boardOrder: 1, createdAt: -1 } },
        [...TASK_POPULATE_PATHS],
      ),
      this.tasks.count(filter),
    ]);

    return buildCollection(documents.map(presentTask), total, query.page, query.pageSize);
  }

  async getById(id: string): Promise<TaskView> {
    const document = await this.tasks.findByIdWithRelations(id, TASK_POPULATE_PATHS);
    if (!document) throw new ResourceNotFoundError('Task', id);
    return presentTask(document);
  }

  // ── writes ───────────────────────────────────────────────────────────────

  async create(payload: CreateTaskDto, actorId?: string): Promise<TaskView> {
    await this.assertProjectExists(payload.projectId);

    let state = payload.state ?? DEFAULT_WORKFLOW_STATE;
    const labelIds = payload.labels?.length ? await this.labels.resolveIds(payload.labels) : [];

    // A task whose due-date has already passed cannot be active — it belongs in the backlog.
    if (state !== 'Backlog' && state !== 'Completed' && isOverdue(payload.dueDate)) {
      this.logger.debug(`Task "${payload.title}" due ${payload.dueDate} is overdue — demoting to Backlog`);
      state = 'Backlog';
    }

    const created = await this.tasks.insert({
      title: payload.title,
      description: payload.description ?? null,
      state,
      priority: payload.priority ?? DEFAULT_PRIORITY_LEVEL,
      assignee: this.toObjectId(payload.assigneeId),
      reporter: this.toObjectId(payload.reporterId ?? actorId),
      project: this.toObjectId(payload.projectId),
      labels: labelIds,
      startDate: payload.startDate ?? null,
      dueDate: payload.dueDate ?? null,
      boardOrder: await this.tasks.nextBoardOrder(state),
    });

    this.activity.record({
      verb: 'task.created',
      taskId: String(created._id),
      projectId: payload.projectId ?? undefined,
      actorId,
      payload: { to: payload.title },
    });

    return this.getById(String(created._id));
  }

  /**
   * Applies a partial update and narrates the diff to the activity stream.
   *
   * The pre-update document is read first so each announcement can carry both
   * sides of the change — "priority: Low → Urgent" rather than a bare "task
   * updated", which is what makes the Updates panel worth reading.
   */
  async update(id: string, changes: UpdateTaskDto, actorId?: string): Promise<TaskView> {
    await this.assertProjectExists(changes.projectId);

    const before = await this.tasks.findByIdOrFail(id);
    const patch: UpdateQuery<TaskDocument>['$set'] = {};

    if (changes.title !== undefined && changes.title !== before.title) {
      patch.title = changes.title;
      this.activity.recordChange({ verb: 'task.renamed', taskId: id, actorId }, before.title, changes.title);
    }

    if (changes.description !== undefined && (changes.description ?? null) !== before.description) {
      patch.description = changes.description ?? null;
      this.activity.record({ verb: 'task.described', taskId: id, actorId });
    }

    if (changes.state !== undefined && changes.state !== before.state) {
      patch.state = changes.state;
      // Moving columns sends the card to the bottom of its new column.
      patch.boardOrder = await this.tasks.nextBoardOrder(changes.state);
      this.activity.recordChange({ verb: 'task.state-changed', taskId: id, actorId }, before.state, changes.state);
    }

    if (changes.priority !== undefined && changes.priority !== before.priority) {
      patch.priority = changes.priority;
      this.activity.recordChange(
        { verb: 'task.priority-changed', taskId: id, actorId },
        before.priority,
        changes.priority,
      );
    }

    if (changes.assigneeId !== undefined) {
      const next = this.toObjectId(changes.assigneeId);
      patch.assignee = next;
      this.activity.recordChange(
        { verb: 'task.assignee-changed', taskId: id, actorId },
        before.assignee ? String(before.assignee) : null,
        next ? String(next) : null,
      );
    }

    if (changes.projectId !== undefined) {
      patch.project = this.toObjectId(changes.projectId);
    }

    if (changes.dueDate !== undefined && (changes.dueDate ?? null) !== before.dueDate) {
      patch.dueDate = changes.dueDate ?? null;
      this.activity.recordChange(
        { verb: 'task.due-date-changed', taskId: id, actorId },
        before.dueDate,
        changes.dueDate ?? null,
      );

      // When a due date is set (or changed) to a past date, and the task is
      // still in an active column, push it to the backlog so it doesn't
      // clutter the board.
      const effectiveDue = changes.dueDate ?? before.dueDate;
      const effectiveState = changes.state ?? before.state;
      if (effectiveState !== 'Backlog' && effectiveState !== 'Completed' && isOverdue(effectiveDue)) {
        patch.state = 'Backlog';
        patch.boardOrder = await this.tasks.nextBoardOrder('Backlog');
        this.activity.recordChange(
          { verb: 'task.state-changed', taskId: id, actorId },
          effectiveState,
          'Backlog',
        );
      }
    }

    if (changes.startDate !== undefined) {
      patch.startDate = changes.startDate ?? null;
    }

    if (changes.labels !== undefined) {
      const labelIds = await this.labels.resolveIds(changes.labels);
      patch.labels = labelIds;
      this.activity.record({
        verb: 'task.labels-changed',
        taskId: id,
        actorId,
        payload: { to: changes.labels.join(', ') || 'none' },
      });
    }

    if (Object.keys(patch).length === 0) return this.getById(id);

    await this.tasks.patchById(id, { $set: patch });
    return this.getById(id);
  }

  /**
   * Persists a drag-and-drop. The client sends the destination column's full
   * order, so replaying the same request twice lands on the same result.
   */
  async placeOnBoard(payload: PlaceOnBoardDto, actorId?: string): Promise<void> {
    const moved = await this.tasks.findMany({ _id: { $in: payload.orderedIds } });
    if (moved.length !== payload.orderedIds.length) {
      throw new UnprocessableRequestError('One or more tasks in the requested order no longer exist', {
        requested: payload.orderedIds.length,
        found: moved.length,
      });
    }

    const relocated = moved.filter((task) => task.state !== payload.state);
    await this.tasks.applyColumnOrder(payload.state, payload.orderedIds);

    for (const task of relocated) {
      this.activity.recordChange(
        { verb: 'task.state-changed', taskId: String(task._id), actorId },
        task.state,
        payload.state,
      );
    }
  }

  async archive(id: string, actorId?: string): Promise<void> {
    await this.tasks.patchById(id, { $set: { archivedAt: new Date() } });
    this.activity.record({ verb: 'task.archived', taskId: id, actorId });
  }

  // ── checklist ────────────────────────────────────────────────────────────

  async addChecklistItem(taskId: string, payload: AddChecklistItemDto, actorId?: string): Promise<TaskView> {
    await this.tasks.patchById(taskId, {
      $push: {
        checklist: {
          title: payload.title,
          priority: payload.priority ?? DEFAULT_PRIORITY_LEVEL,
          assignee: this.toObjectId(payload.assigneeId),
          dueDate: payload.dueDate ?? null,
          completedAt: null,
        },
      },
    });

    this.activity.record({
      verb: 'checklist.item-added',
      taskId,
      actorId,
      payload: { to: payload.title },
    });

    return this.getById(taskId);
  }

  async updateChecklistItem(
    taskId: string,
    itemId: string,
    changes: UpdateChecklistItemDto,
    actorId?: string,
  ): Promise<TaskView> {
    const task = await this.tasks.findByIdOrFail(taskId);
    const item = task.checklist.find((entry) => String(entry._id) === itemId);
    if (!item) throw new ResourceNotFoundError('Checklist item', itemId);

    const patch: Record<string, unknown> = {};
    if (changes.title !== undefined) patch['checklist.$[item].title'] = changes.title;
    if (changes.priority !== undefined) patch['checklist.$[item].priority'] = changes.priority;
    if (changes.dueDate !== undefined) patch['checklist.$[item].dueDate'] = changes.dueDate ?? null;
    if (changes.completed !== undefined) {
      patch['checklist.$[item].completedAt'] = changes.completed ? new Date() : null;
    }

    if (Object.keys(patch).length > 0) {
      await this.tasks.patchChecklistItem(taskId, itemId, patch);
    }

    if (changes.completed) {
      this.activity.record({
        verb: 'checklist.item-completed',
        taskId,
        actorId,
        payload: { to: changes.title ?? item.title },
      });
    }

    return this.getById(taskId);
  }

  async removeChecklistItem(taskId: string, itemId: string, actorId?: string): Promise<TaskView> {
    const task = await this.tasks.findByIdOrFail(taskId);
    const item = task.checklist.find((entry) => String(entry._id) === itemId);
    if (!item) throw new ResourceNotFoundError('Checklist item', itemId);

    await this.tasks.patchById(taskId, { $pull: { checklist: { _id: new Types.ObjectId(itemId) } } });

    this.activity.record({
      verb: 'checklist.item-removed',
      taskId,
      actorId,
      payload: { from: item.title },
    });

    return this.getById(taskId);
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  private toObjectId(value?: string | null): Types.ObjectId | null {
    return value ? new Types.ObjectId(value) : null;
  }

  /**
   * Guards against dangling references. `null` is a legitimate value (detach
   * the task from its project) so only a non-empty id is checked.
   */
  private async assertProjectExists(projectId?: string | null): Promise<void> {
    if (!projectId) return;
    if (!(await this.projects.exists({ _id: projectId }))) {
      throw new ResourceNotFoundError('Project', projectId);
    }
  }

  /** Accepts either label names or slugs in the `?labels=` filter. */
  private async resolveLabelFilter(values: string[]): Promise<Types.ObjectId[]> {
    const slugs = values.map(toLabelSlug);
    const documents = await this.labelStore.findMany({ slug: { $in: slugs } });
    return documents.map((document) => document._id as Types.ObjectId);
  }
}
