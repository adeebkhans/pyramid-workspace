import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ObjectIdPipe } from '@pyramid/shared/http/object-id.pipe';
import { CommentView } from './comment.presenter';
import { CommentsService } from './comments.service';
import { EditCommentDto, PostCommentDto, ThreadQuery } from './dto/comment.dto';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get()
  @ApiOperation({ summary: 'Fetch a task’s comment thread, replies nested under their parent' })
  @ApiOkResponse({ type: [CommentView] })
  thread(@Query() query: ThreadQuery) {
    return this.comments.threadForTask(query.taskId);
  }

  @Post()
  @ApiOperation({ summary: 'Post a comment or a reply' })
  @ApiOkResponse({ type: CommentView })
  post(@Body() payload: PostCommentDto) {
    return this.comments.post(payload);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit a comment; stamps an edited-at marker' })
  @ApiOkResponse({ type: CommentView })
  edit(@Param('id', ObjectIdPipe) id: string, @Body() changes: EditCommentDto) {
    return this.comments.edit(id, changes);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment and any replies beneath it' })
  remove(@Param('id', ObjectIdPipe) id: string) {
    return this.comments.remove(id);
  }
}
