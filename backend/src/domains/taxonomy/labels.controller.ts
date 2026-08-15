import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ObjectIdPipe } from '@pyramid/shared/http/object-id.pipe';
import { CreateLabelDto, LabelQuery } from './dto/label.dto';
import { LabelView } from './label.presenter';
import { LabelsService } from './labels.service';

@ApiTags('labels')
@Controller('labels')
export class LabelsController {
  constructor(private readonly labels: LabelsService) {}

  @Get()
  @ApiOperation({ summary: 'List the workspace label taxonomy' })
  list(@Query() query: LabelQuery) {
    return this.labels.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a label, or return the existing one with the same slug' })
  @ApiOkResponse({ type: LabelView })
  create(@Body() payload: CreateLabelDto) {
    return this.labels.ensure(payload);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a label from the taxonomy' })
  remove(@Param('id', ObjectIdPipe) id: string) {
    return this.labels.remove(id);
  }
}
