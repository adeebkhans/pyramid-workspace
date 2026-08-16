import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { MongoRepository } from '@pyramid/shared/persistence/mongo.repository';
import { MODEL } from '@pyramid/shared/persistence/schema-options';
import { Comment, type CommentDocument } from './comment.schema';

@Injectable()
export class CommentRepository extends MongoRepository<Comment> {
  constructor(@InjectModel(MODEL.comment) model: Model<Comment>) {
    super(model, 'Comment');
  }

  /** Whole thread in one query — roots and replies together, oldest first. */
  findThread(taskId: string): Promise<CommentDocument[]> {
    return this.findMany({ task: taskId }, { skip: 0, limit: 500, sort: { createdAt: 1 } }, ['author']);
  }

  /** Deleting a root takes its replies with it. */
  async removeWithReplies(commentId: string): Promise<void> {
    await this.removeMany({ parent: commentId });
    await this.removeById(commentId);
  }
}
