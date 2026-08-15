import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MODEL } from '@pyramid/shared/persistence/schema-options';
import { ActivityController } from './activity.controller';
import { ActivityPublisher, ActivityRecorder } from './activity.recorder';
import { ActivityRepository } from './activity.repository';
import { ActivitySchema } from './activity.schema';
import { ActivityService } from './activity.service';

/**
 * Global because nearly every write path in the system has something to
 * announce; importing this module into each of them would be noise.
 */
@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: MODEL.activity, schema: ActivitySchema }])],
  controllers: [ActivityController],
  providers: [ActivityRepository, ActivityService, ActivityRecorder, ActivityPublisher],
  exports: [ActivityService, ActivityPublisher],
})
export class ActivityModule {}
