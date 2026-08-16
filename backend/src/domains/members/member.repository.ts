import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { FilterQuery, Model } from 'mongoose';

import { MongoRepository } from '@pyramid/shared/persistence/mongo.repository';
import { MODEL } from '@pyramid/shared/persistence/schema-options';
import { toSafeRegex } from '@pyramid/shared/http/pagination.query';
import { Member, type MemberDocument, type MembershipOrigin } from './member.schema';

@Injectable()
export class MemberRepository extends MongoRepository<Member> {
  constructor(@InjectModel(MODEL.member) model: Model<Member>) {
    super(model, 'Member');
  }

  buildFilter(criteria: { search?: string; origin?: MembershipOrigin }): FilterQuery<Member> {
    const filter: FilterQuery<Member> = {};

    if (criteria.origin) filter.origin = criteria.origin;
    if (criteria.search) {
      const pattern = toSafeRegex(criteria.search);
      filter.$or = [{ displayName: pattern }, { email: pattern }];
    }

    return filter;
  }

  findByEmail(email: string): Promise<MemberDocument | null> {
    return this.findOne({ email: email.trim().toLowerCase() });
  }
}
