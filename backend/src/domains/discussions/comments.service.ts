import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

import { ActivityPublisher } from '@pyramid/domains/activity/activity.recorder';
import { UnprocessableRequestError } from '@pyramid/shared/errors/domain.errors';
import { CommentRepository } from './comment.repository';
import { CommentView, presentComment, presentThread } from './comment.presenter';
import type { EditCommentDto, PostCommentDto } from './dto/comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly comments: CommentRepository,
    private readonly activity: ActivityPublisher,
  ) {}

  async threadForTask(taskId: string): Promise<CommentView[]> {
    return presentThread(await this.comments.findThread(taskId));
  }

  async post(payload: PostCommentDto): Promise<CommentView> {
    if (payload.parentId) await this.assertReplyTarget(payload.parentId);

    const created = await this.comments.insert({
      body: payload.body,
      task: new Types.ObjectId(payload.taskId),
      author: new Types.ObjectId(payload.authorId),
      parent: payload.parentId ? new Types.ObjectId(payload.parentId) : null,
    });

    this.activity.record({ verb: 'comment.posted', taskId: payload.taskId, actorId: payload.authorId });

    const withAuthor = await this.comments.findByIdOrFail(String(created._id), ['author']);
    return presentComment(withAuthor);
  }

  async edit(id: string, changes: EditCommentDto): Promise<CommentView> {
    const updated = await this.comments.patchById(id, { $set: { body: changes.body, editedAt: new Date() } }, [
      'author',
    ]);

    this.activity.record({ verb: 'comment.edited', taskId: String(updated.task), actorId: String(updated.author) });
    return presentComment(updated);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.comments.findByIdOrFail(id);
    await this.comments.removeWithReplies(id);

    this.activity.record({
      verb: 'comment.removed',
      taskId: String(existing.task),
      actorId: String(existing.author),
    });
  }

  /** Threading is capped at one level, so a reply cannot itself be replied to. */
  private async assertReplyTarget(parentId: string): Promise<void> {
    const parent = await this.comments.findByIdOrFail(parentId);
    if (parent.parent) {
      throw new UnprocessableRequestError('Replies are limited to one level deep', { parentId });
    }
  }
}
