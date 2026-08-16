import { Injectable, Logger } from '@nestjs/common';

import { buildCollection, type CollectionResponse } from '@pyramid/shared/http/collection-response';
import { buildAvatarUrl, buildInitials } from '@pyramid/shared/utils/avatar.factory';
import { mintGuestIdentity } from '@pyramid/shared/utils/guest-identity';
import type { EnrolMemberDto, MemberQuery, SyncFederatedMemberDto, UpdateMemberDto } from './dto/member.dto';
import { MemberRepository } from './member.repository';
import { MemberView, presentMember } from './member.presenter';

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(private readonly members: MemberRepository) {}

  async list(query: MemberQuery): Promise<CollectionResponse<MemberView>> {
    const filter = this.members.buildFilter({ search: query.search, origin: query.origin });

    const [documents, total] = await Promise.all([
      this.members.findMany(filter, { skip: query.skip, limit: query.pageSize, sort: { displayName: 1 } }),
      this.members.count(filter),
    ]);

    return buildCollection(documents.map(presentMember), total, query.page, query.pageSize);
  }

  async getById(id: string): Promise<MemberView> {
    const document = await this.members.findByIdOrFail(id);
    return presentMember(document);
  }

  async getByEmail(email: string): Promise<MemberView | null> {
    const document = await this.members.findByEmail(email);
    return document ? presentMember(document) : null;
  }

  async enrol(payload: EnrolMemberDto): Promise<MemberView> {
    const existing = await this.members.findByEmail(payload.email);
    if (existing) return presentMember(existing);

    const document = await this.members.insert({
      displayName: payload.name,
      email: payload.email,
      avatarUrl: payload.avatarUrl ?? buildAvatarUrl(payload.email),
      initials: buildInitials(payload.name),
      jobTitle: payload.jobTitle ?? null,
      origin: payload.origin ?? 'federated',
    });

    return presentMember(document);
  }

  /**
   * Guest sign-in mints a brand new member on every call, so each visitor is a
   * real, separate identity for the rest of the system. Two people can demo the
   * board side by side and still see distinct authors and avatars.
   */
  async openGuestSession(): Promise<MemberView> {
    const identity = mintGuestIdentity();

    const document = await this.members.insert({
      displayName: identity.displayName,
      email: identity.email,
      handle: identity.handle,
      avatarUrl: buildAvatarUrl(identity.email),
      initials: buildInitials(identity.displayName),
      origin: 'guest',
    });

    this.logger.log(`Opened guest session for ${identity.displayName}`);
    return presentMember(document);
  }

  /**
   * Called by the OAuth callback. Idempotent by email: repeated sign-ins
   * refresh the display name and picture instead of creating duplicates.
   */
  async syncFederated(payload: SyncFederatedMemberDto): Promise<MemberView> {
    const document = await this.members.upsertOne(
      { email: payload.email.trim().toLowerCase() },
      {
        $set: {
          displayName: payload.name,
          initials: buildInitials(payload.name),
          avatarUrl: payload.avatarUrl ?? buildAvatarUrl(payload.email),
          lastSeenAt: new Date(),
        },
        $setOnInsert: {
          email: payload.email.trim().toLowerCase(),
          origin: 'federated',
        },
      },
    );

    return presentMember(document);
  }

  async update(id: string, changes: UpdateMemberDto): Promise<MemberView> {
    const patch: Record<string, unknown> = {};

    if (changes.name !== undefined) {
      patch.displayName = changes.name;
      patch.initials = buildInitials(changes.name);
    }
    if (changes.jobTitle !== undefined) patch.jobTitle = changes.jobTitle || null;
    if (changes.handle !== undefined) patch.handle = changes.handle || null;
    if (changes.avatarSeed !== undefined) patch.avatarUrl = buildAvatarUrl(changes.avatarSeed);

    const document = await this.members.patchById(id, { $set: patch });
    return presentMember(document);
  }
}
