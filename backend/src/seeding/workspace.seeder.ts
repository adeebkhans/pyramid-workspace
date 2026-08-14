import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';

import { CommentRepository } from '@pyramid/domains/discussions/comment.repository';
import { MemberRepository } from '@pyramid/domains/members/member.repository';
import { ProjectRepository } from '@pyramid/domains/projects/project.repository';
import { LabelsService } from '@pyramid/domains/taxonomy/labels.service';
import { TaskRepository } from '@pyramid/domains/tasks/task.repository';
import { BOARD_ORDER_STEP } from '@pyramid/domains/tasks/task.schema';
import { buildAvatarUrl, buildInitials } from '@pyramid/shared/utils/avatar.factory';
import {
  LABEL_BLUEPRINTS,
  MEMBER_BLUEPRINTS,
  PROJECT_BLUEPRINTS,
  TASK_BLUEPRINTS,
  dueDateFor,
} from './workspace.blueprint';

export interface SeedReport {
  skipped: boolean;
  members: number;
  labels: number;
  projects: number;
  tasks: number;
  comments: number;
}

/**
 * Populates an empty database with a workspace worth demonstrating.
 *
 * Two properties matter here. It is **idempotent** — a database that already
 * holds members is left alone, so a restart never duplicates data. And it is
 * **explicit** — nothing runs unless `SEED_ON_BOOT` is set or the CLI is
 * invoked, so a production database is never written to by accident.
 */
@Injectable()
export class WorkspaceSeeder {
  private readonly logger = new Logger(WorkspaceSeeder.name);

  constructor(
    private readonly members: MemberRepository,
    private readonly projects: ProjectRepository,
    private readonly tasks: TaskRepository,
    private readonly comments: CommentRepository,
    private readonly labels: LabelsService,
  ) {}

  async run(options: { force?: boolean } = {}): Promise<SeedReport> {
    const populated = await this.members.count({ origin: { $ne: 'guest' } });

    if (populated > 0 && !options.force) {
      this.logger.log('Workspace already populated — skipping seed');
      return { skipped: true, members: 0, labels: 0, projects: 0, tasks: 0, comments: 0 };
    }

    if (options.force) await this.wipe();

    const memberIds = await this.seedMembers();
    const labelCount = await this.seedLabels();
    const projectIds = await this.seedProjects(memberIds);
    const { tasks, comments } = await this.seedTasks(memberIds, projectIds);

    this.logger.log(`Seeded ${memberIds.size} members, ${projectIds.size} projects and ${tasks} tasks`);

    return {
      skipped: false,
      members: memberIds.size,
      labels: labelCount,
      projects: projectIds.size,
      tasks,
      comments,
    };
  }

  private async wipe(): Promise<void> {
    this.logger.warn('Force flag set — clearing existing workspace data');
    await Promise.all([
      this.comments.removeMany({}),
      this.tasks.removeMany({}),
      this.projects.removeMany({}),
      this.members.removeMany({ origin: { $ne: 'guest' } }),
    ]);
  }

  private async seedMembers(): Promise<Map<string, Types.ObjectId>> {
    const registry = new Map<string, Types.ObjectId>();

    for (const blueprint of MEMBER_BLUEPRINTS) {
      const document = await this.members.upsertOne(
        { email: blueprint.email },
        {
          $set: {
            displayName: blueprint.name,
            // Every member gets their own generated portrait, seeded from the
            // email so it is stable across re-seeds.
            avatarUrl: buildAvatarUrl(blueprint.email),
            initials: buildInitials(blueprint.name),
            jobTitle: blueprint.jobTitle,
            origin: 'seeded',
          },
          $setOnInsert: { email: blueprint.email },
        },
      );

      registry.set(blueprint.key, document._id as Types.ObjectId);
    }

    return registry;
  }

  private async seedLabels(): Promise<number> {
    const ids = await this.labels.resolveIds(LABEL_BLUEPRINTS);
    return ids.length;
  }

  private async seedProjects(members: Map<string, Types.ObjectId>): Promise<Map<string, Types.ObjectId>> {
    const registry = new Map<string, Types.ObjectId>();

    for (const blueprint of PROJECT_BLUEPRINTS) {
      const document = await this.projects.insert({
        title: blueprint.title,
        summary: blueprint.summary,
        priority: blueprint.priority,
        lead: members.get(blueprint.leadKey) ?? null,
        dueDate: dueDateFor(blueprint.dueInDays),
      });

      registry.set(blueprint.key, document._id as Types.ObjectId);
    }

    return registry;
  }

  private async seedTasks(
    members: Map<string, Types.ObjectId>,
    projects: Map<string, Types.ObjectId>,
  ): Promise<{ tasks: number; comments: number }> {
    const orderByState = new Map<string, number>();
    let commentCount = 0;

    for (const blueprint of TASK_BLUEPRINTS) {
      const nextOrder = (orderByState.get(blueprint.state) ?? 0) + BOARD_ORDER_STEP;
      orderByState.set(blueprint.state, nextOrder);

      const labelIds = await this.labels.resolveIds(blueprint.labels);

      const task = await this.tasks.insert({
        title: blueprint.title,
        description: blueprint.description ?? null,
        state: blueprint.state,
        priority: blueprint.priority,
        assignee: members.get(blueprint.assigneeKey) ?? null,
        reporter: members.get('dexter') ?? null,
        project: projects.get(blueprint.projectKey) ?? null,
        labels: labelIds,
        dueDate: dueDateFor(blueprint.dueInDays),
        boardOrder: nextOrder,
        checklist: (blueprint.checklist ?? []).map((item) => ({
          _id: new Types.ObjectId(),
          title: item.title,
          priority: item.priority,
          assignee: item.assigneeKey ? (members.get(item.assigneeKey) ?? null) : null,
          dueDate: dueDateFor(item.dueInDays),
          completedAt: item.done ? new Date() : null,
          createdAt: new Date(),
        })),
      });

      for (const comment of blueprint.comments ?? []) {
        const root = await this.comments.insert({
          body: comment.body,
          task: task._id as Types.ObjectId,
          author: members.get(comment.authorKey) as Types.ObjectId,
          parent: null,
        });
        commentCount += 1;

        for (const reply of comment.replies ?? []) {
          await this.comments.insert({
            body: reply.body,
            task: task._id as Types.ObjectId,
            author: members.get(reply.authorKey) as Types.ObjectId,
            parent: root._id as Types.ObjectId,
          });
          commentCount += 1;
        }
      }
    }

    return { tasks: TASK_BLUEPRINTS.length, comments: commentCount };
  }
}
