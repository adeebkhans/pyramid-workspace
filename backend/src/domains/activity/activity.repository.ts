import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { MongoRepository } from '@pyramid/shared/persistence/mongo.repository';
import { MODEL } from '@pyramid/shared/persistence/schema-options';
import { Activity, type ActivityDocument } from './activity.schema';

@Injectable()
export class ActivityRepository extends MongoRepository<Activity> {
  constructor(@InjectModel(MODEL.activity) model: Model<Activity>) {
    super(model, 'Activity');
  }

  streamForTask(taskId: string, limit: number): Promise<ActivityDocument[]> {
    return this.findMany({ task: taskId }, { skip: 0, limit, sort: { createdAt: -1 } }, ['actor']);
  }
}
