import { Injectable } from '@nestjs/common';
import type { Types } from 'mongoose';

import { buildCollection, type CollectionResponse } from '@pyramid/shared/http/collection-response';
import { toSafeRegex } from '@pyramid/shared/http/pagination.query';
import type { CreateLabelDto, LabelQuery } from './dto/label.dto';
import { LabelRepository } from './label.repository';
import { LabelView, presentLabel } from './label.presenter';
import { toLabelSlug } from './label.schema';

@Injectable()
export class LabelsService {
  constructor(private readonly labels: LabelRepository) {}

  async list(query: LabelQuery): Promise<CollectionResponse<LabelView>> {
    const filter = query.search ? { name: toSafeRegex(query.search) } : {};

    const [documents, total] = await Promise.all([
      this.labels.findMany(filter, { skip: query.skip, limit: query.pageSize, sort: { name: 1 } }),
      this.labels.count(filter),
    ]);

    return buildCollection(documents.map(presentLabel), total, query.page, query.pageSize);
  }

  /**
   * Create-or-return, keyed on slug. Two people adding "Design" from two task
   * panes should converge on one label rather than one of them hitting a
   * duplicate-key error.
   */
  async ensure(payload: CreateLabelDto): Promise<LabelView> {
    const slug = toLabelSlug(payload.name);

    const document = await this.labels.upsertOne(
      { slug },
      {
        $set: {
          name: payload.name,
          ...(payload.description === undefined ? {} : { description: payload.description }),
        },
        $setOnInsert: { slug },
      },
    );

    return presentLabel(document);
  }

  /** Turns display names into ids, minting labels that do not exist yet. */
  async resolveIds(names: string[]): Promise<Types.ObjectId[]> {
    const unique = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
    if (unique.length === 0) return [];

    const documents = await Promise.all(
      unique.map(async (name) => {
        const slug = toLabelSlug(name);
        return this.labels.upsertOne({ slug }, { $set: { name }, $setOnInsert: { slug } });
      }),
    );

    return documents.map((document) => document._id as Types.ObjectId);
  }

  async remove(id: string): Promise<void> {
    await this.labels.removeById(id);
  }
}
