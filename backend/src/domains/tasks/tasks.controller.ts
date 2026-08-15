import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ObjectIdPipe } from '@pyramid/shared/http/object-id.pipe';
import {
  ActorQuery,
  AddChecklistItemDto,
  CreateTaskDto,
  PlaceOnBoardDto,
  TaskQuery,
  UpdateChecklistItemDto,
  UpdateTaskDto,
} from './dto/task.dto';
import { TaskView } from './task.presenter';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List tasks with filtering, search and pagination' })
  list(@Query() query: TaskQuery) {
    return this.tasks.list(query);
  }

  /**
   * Registered before `:id` so the literal segment wins the route match.
   */
  @Put('board/placement')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Persist a drag-and-drop by declaring a column’s new order' })
  placeOnBoard(@Body() payload: PlaceOnBoardDto, @Query() actor: ActorQuery) {
    return this.tasks.placeOnBoard(payload, actor.actorId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a task' })
  @ApiOkResponse({ type: TaskView })
  create(@Body() payload: CreateTaskDto, @Query() actor: ActorQuery) {
    return this.tasks.create(payload, actor.actorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a task with its assignee, project, labels and checklist' })
  @ApiOkResponse({ type: TaskView })
  getOne(@Param('id', ObjectIdPipe) id: string) {
    return this.tasks.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Apply a partial update; every field change is written to the activity stream' })
  @ApiOkResponse({ type: TaskView })
  update(@Param('id', ObjectIdPipe) id: string, @Body() changes: UpdateTaskDto, @Query() actor: ActorQuery) {
    return this.tasks.update(id, changes, actor.actorId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a task (soft delete — history is preserved)' })
  archive(@Param('id', ObjectIdPipe) id: string, @Query() actor: ActorQuery) {
    return this.tasks.archive(id, actor.actorId);
  }

  @Post(':id/checklist')
  @ApiOperation({ summary: 'Append a checklist item' })
  @ApiOkResponse({ type: TaskView })
  addChecklistItem(
    @Param('id', ObjectIdPipe) id: string,
    @Body() payload: AddChecklistItemDto,
    @Query() actor: ActorQuery,
  ) {
    return this.tasks.addChecklistItem(id, payload, actor.actorId);
  }

  @Patch(':id/checklist/:itemId')
  @ApiOperation({ summary: 'Update or tick off a checklist item' })
  @ApiOkResponse({ type: TaskView })
  updateChecklistItem(
    @Param('id', ObjectIdPipe) id: string,
    @Param('itemId', ObjectIdPipe) itemId: string,
    @Body() changes: UpdateChecklistItemDto,
    @Query() actor: ActorQuery,
  ) {
    return this.tasks.updateChecklistItem(id, itemId, changes, actor.actorId);
  }

  @Delete(':id/checklist/:itemId')
  @ApiOperation({ summary: 'Remove a checklist item' })
  @ApiOkResponse({ type: TaskView })
  removeChecklistItem(
    @Param('id', ObjectIdPipe) id: string,
    @Param('itemId', ObjectIdPipe) itemId: string,
    @Query() actor: ActorQuery,
  ) {
    return this.tasks.removeChecklistItem(id, itemId, actor.actorId);
  }
}
