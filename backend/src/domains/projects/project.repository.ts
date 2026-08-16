import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { FilterQuery, Model } from 'mongoose';

import { toSafeRegex } from '@pyramid/shared/http/pagination.query';
import { MongoRepository } from '@pyramid/shared/persistence/mongo.repository';
import { MODEL } from '@pyramid/shared/persistence/schema-options';
import type { PriorityLevel } from '@pyramid/shared/domain/workflow';
import { Project } from './project.schema';

export interface ProjectFilterCriteria {
  search?: string;
  priority?: PriorityLevel;
  leadId?: string;
  includeArchived?: boolean;
}

@Injectable()
export class ProjectRepository extends MongoRepository<Project> {
  constructor(@InjectModel(MODEL.project) model: Model<Project>) {
    super(model, 'Project');
  }

  buildFilter(criteria: ProjectFilterCriteria): FilterQuery<Project> {
    const filter: FilterQuery<Project> = {};

    if (!criteria.includeArchived) filter.archivedAt = null;
    if (criteria.priority) filter.priority = criteria.priority;
    if (criteria.leadId) filter.lead = criteria.leadId;
    if (criteria.search) filter.title = toSafeRegex(criteria.search);

    return filter;
  }
}
