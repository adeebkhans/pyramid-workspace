import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { MongoRepository } from '@pyramid/shared/persistence/mongo.repository';
import { MODEL } from '@pyramid/shared/persistence/schema-options';
import { Label } from './label.schema';

@Injectable()
export class LabelRepository extends MongoRepository<Label> {
  constructor(@InjectModel(MODEL.label) model: Model<Label>) {
    super(model, 'Label');
  }
}
