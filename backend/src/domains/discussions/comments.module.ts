import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MODEL } from '@pyramid/shared/persistence/schema-options';
import { CommentRepository } from './comment.repository';
import { CommentSchema } from './comment.schema';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: MODEL.comment, schema: CommentSchema }])],
  controllers: [CommentsController],
  providers: [CommentRepository, CommentsService],
  exports: [CommentsService, CommentRepository],
})
export class CommentsModule {}
