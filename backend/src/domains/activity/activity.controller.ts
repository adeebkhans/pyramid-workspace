import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { ObjectIdPipe } from '@pyramid/shared/http/object-id.pipe';
import { ActivityService } from './activity.service';

@ApiTags('activity')
@Controller('activity')
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  @Get()
  @ApiOperation({ summary: 'Newest-first activity stream for a single task' })
  @ApiQuery({ name: 'taskId', required: true })
  @ApiQuery({ name: 'limit', required: false })
  streamForTask(
    @Query('taskId', ObjectIdPipe) taskId: string,
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit: number,
  ) {
    return this.activity.streamForTask(taskId, limit);
  }
}
