import { Injectable } from '@nestjs/common';

import { ActivityRepository } from './activity.repository';
import { ActivityView, presentActivity } from './activity.presenter';

const DEFAULT_STREAM_LENGTH = 25;
const MAX_STREAM_LENGTH = 100;

@Injectable()
export class ActivityService {
  constructor(private readonly activities: ActivityRepository) {}

  async streamForTask(taskId: string, limit = DEFAULT_STREAM_LENGTH): Promise<ActivityView[]> {
    const bounded = Math.min(Math.max(limit, 1), MAX_STREAM_LENGTH);
    const documents = await this.activities.streamForTask(taskId, bounded);
    return documents.map(presentActivity);
  }
}
