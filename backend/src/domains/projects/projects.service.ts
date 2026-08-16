import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

import { buildCollection, type CollectionResponse } from '@pyramid/shared/http/collection-response';
import { DEFAULT_PRIORITY_LEVEL } from '@pyramid/shared/domain/workflow';
import type { CreateProjectDto, ProjectQuery, UpdateProjectDto } from './dto/project.dto';
import { ProjectInsightsRepository } from './project-insights.repository';
import { ProjectRepository } from './project.repository';
import { ProjectView, presentProject, toProgress } from './project.presenter';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly insights: ProjectInsightsRepository,
  ) {}

  async list(query: ProjectQuery): Promise<CollectionResponse<ProjectView>> {
    const filter = this.projects.buildFilter({
      search: query.search,
      priority: query.priority,
      leadId: query.leadId,
      includeArchived: query.includeArchived,
    });

    const [documents, total] = await Promise.all([
      this.projects.findMany(filter, { skip: query.skip, limit: query.pageSize, sort: { createdAt: 1 } }, ['lead']),
      this.projects.count(filter),
    ]);

    const tallies = query.withProgress
      ? await this.insights.tallyByProject(documents.map((document) => String(document._id)))
      : new Map();

    const views = documents.map((document) => {
      const tally = tallies.get(String(document._id));
      return presentProject(document, tally ? toProgress(tally.total, tally.completed) : undefined);
    });

    return buildCollection(views, total, query.page, query.pageSize);
  }

  async getById(id: string): Promise<ProjectView> {
    const document = await this.projects.findByIdOrFail(id, ['lead']);
    const tallies = await this.insights.tallyByProject([id]);
    const tally = tallies.get(id);

    return presentProject(document, toProgress(tally?.total ?? 0, tally?.completed ?? 0));
  }

  async create(payload: CreateProjectDto): Promise<ProjectView> {
    const document = await this.projects.insert({
      title: payload.title,
      summary: payload.summary ?? null,
      priority: payload.priority ?? DEFAULT_PRIORITY_LEVEL,
      lead: payload.leadId ? new Types.ObjectId(payload.leadId) : null,
      dueDate: payload.dueDate ?? null,
    });

    return this.getById(String(document._id));
  }

  async update(id: string, changes: UpdateProjectDto): Promise<ProjectView> {
    const patch: Record<string, unknown> = {};

    if (changes.title !== undefined) patch.title = changes.title;
    if (changes.summary !== undefined) patch.summary = changes.summary || null;
    if (changes.priority !== undefined) patch.priority = changes.priority;
    if (changes.dueDate !== undefined) patch.dueDate = changes.dueDate || null;
    if (changes.leadId !== undefined) {
      patch.lead = changes.leadId ? new Types.ObjectId(changes.leadId) : null;
    }

    await this.projects.patchById(id, { $set: patch });
    return this.getById(id);
  }

  /**
   * Archiving is a soft delete: the project leaves the list, its tasks are
   * detached rather than destroyed, and nothing in the activity stream is lost.
   */
  async archive(id: string): Promise<void> {
    await this.projects.patchById(id, { $set: { archivedAt: new Date() } });
    await this.insights.detachTasks(id);
  }

  async assertExists(id: string): Promise<void> {
    await this.projects.findByIdOrFail(id);
  }
}
