import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ObjectIdPipe } from '@pyramid/shared/http/object-id.pipe';
import { CreateProjectDto, ProjectQuery, UpdateProjectDto } from './dto/project.dto';
import { ProjectView } from './project.presenter';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List projects, optionally with task-completion counts' })
  list(@Query() query: ProjectQuery) {
    return this.projects.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a project' })
  @ApiOkResponse({ type: ProjectView })
  create(@Body() payload: CreateProjectDto) {
    return this.projects.create(payload);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a project with its lead and progress tally' })
  @ApiOkResponse({ type: ProjectView })
  getOne(@Param('id', ObjectIdPipe) id: string) {
    return this.projects.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiOkResponse({ type: ProjectView })
  update(@Param('id', ObjectIdPipe) id: string, @Body() changes: UpdateProjectDto) {
    return this.projects.update(id, changes);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a project and detach its tasks' })
  archive(@Param('id', ObjectIdPipe) id: string) {
    return this.projects.archive(id);
  }
}
