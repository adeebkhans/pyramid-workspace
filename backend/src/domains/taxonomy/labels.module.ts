import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MODEL } from '@pyramid/shared/persistence/schema-options';
import { LabelRepository } from './label.repository';
import { LabelSchema } from './label.schema';
import { LabelsController } from './labels.controller';
import { LabelsService } from './labels.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: MODEL.label, schema: LabelSchema }])],
  controllers: [LabelsController],
  providers: [LabelRepository, LabelsService],
  exports: [LabelsService, LabelRepository],
})
export class LabelsModule {}
