import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Types } from 'mongoose';

import { ACTIVITY_EVENT_CHANNEL, type ActivityDraft } from '@pyramid/shared/domain/activity-verbs';
import { ActivityRepository } from './activity.repository';

/**
 * Writing history is decoupled from the mutation that produced it.
 *
 * `TasksService` announces "this happened" on the event bus and returns; the
 * recorder persists it out of band. That keeps a failing audit write from
 * turning a successful task update into a 500, and it means adding a new
 * listener later (notifications, webhooks) touches nothing in the task domain.
 */
@Injectable()
export class ActivityRecorder {
  private readonly logger = new Logger(ActivityRecorder.name);

  constructor(private readonly activities: ActivityRepository) {}

  @OnEvent(ACTIVITY_EVENT_CHANNEL, { async: true })
  async onActivityRecorded(draft: ActivityDraft): Promise<void> {
    try {
      await this.activities.insert({
        verb: draft.verb,
        task: draft.taskId ? new Types.ObjectId(draft.taskId) : null,
        project: draft.projectId ? new Types.ObjectId(draft.projectId) : null,
        actor: draft.actorId ? new Types.ObjectId(draft.actorId) : null,
        payload: draft.payload ?? {},
      });
    } catch (error) {
      this.logger.warn(
        `Dropped activity "${draft.verb}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

/**
 * Thin publisher so domain services depend on an intention-revealing name
 * rather than on `EventEmitter2` and a magic string.
 */
@Injectable()
export class ActivityPublisher {
  constructor(private readonly events: EventEmitter2) {}

  record(draft: ActivityDraft): void {
    this.events.emit(ACTIVITY_EVENT_CHANNEL, draft);
  }

  /** Emits only when the value actually moved — avoids "changed X from A to A". */
  recordChange(draft: Omit<ActivityDraft, 'payload'>, from: unknown, to: unknown): void {
    if (Object.is(from ?? null, to ?? null)) return;
    this.record({ ...draft, payload: { from: from ?? null, to: to ?? null } });
  }
}
