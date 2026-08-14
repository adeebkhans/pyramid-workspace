import type { FilterQuery, HydratedDocument, Model, PipelineStage, ProjectionType, QueryOptions, SortOrder, UpdateQuery } from 'mongoose';

import { ResourceNotFoundError } from '../errors/domain.errors';

export interface PageRequest {
  skip: number;
  limit: number;
  sort?: Record<string, SortOrder>;
}

/**
 * A thin persistence seam between services and Mongoose.
 *
 * Services talk to repositories, repositories talk to models. That boundary is
 * what makes services unit-testable without spinning up Mongo, and it stops
 * driver-specific syntax (`$set`, `lean()`, populate chains) from leaking into
 * business logic.
 */
export abstract class MongoRepository<TSchema> {
  protected constructor(
    protected readonly model: Model<TSchema>,
    private readonly resourceName: string,
  ) {}

  get documentName(): string {
    return this.resourceName;
  }

  async findMany(
    filter: FilterQuery<TSchema> = {},
    page?: PageRequest,
    populate: string[] = [],
  ): Promise<HydratedDocument<TSchema>[]> {
    const query = this.model.find(filter);

    if (page?.sort) query.sort(page.sort);
    if (page) query.skip(page.skip).limit(page.limit);
    for (const path of populate) query.populate(path);

    return query.exec() as unknown as Promise<HydratedDocument<TSchema>[]>;
  }

  async findById(
    id: string,
    populate: string[] = [],
    projection?: ProjectionType<TSchema>,
  ): Promise<HydratedDocument<TSchema> | null> {
    const query = this.model.findById(id, projection);
    for (const path of populate) query.populate(path);
    return query.exec() as unknown as Promise<HydratedDocument<TSchema> | null>;
  }

  /** Same as {@link findById} but throws instead of returning `null`. */
  async findByIdOrFail(id: string, populate: string[] = []): Promise<HydratedDocument<TSchema>> {
    const document = await this.findById(id, populate);
    if (!document) throw new ResourceNotFoundError(this.resourceName, id);
    return document;
  }

  async findOne(filter: FilterQuery<TSchema>, populate: string[] = []): Promise<HydratedDocument<TSchema> | null> {
    const query = this.model.findOne(filter);
    for (const path of populate) query.populate(path);
    return query.exec() as unknown as Promise<HydratedDocument<TSchema> | null>;
  }

  async count(filter: FilterQuery<TSchema> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  async exists(filter: FilterQuery<TSchema>): Promise<boolean> {
    return (await this.model.exists(filter).exec()) !== null;
  }

  async insert(payload: Partial<TSchema>): Promise<HydratedDocument<TSchema>> {
    const created = await this.model.create(payload);
    return created as unknown as HydratedDocument<TSchema>;
  }

  async insertMany(payloads: Partial<TSchema>[]): Promise<HydratedDocument<TSchema>[]> {
    return this.model.insertMany(payloads) as unknown as Promise<HydratedDocument<TSchema>[]>;
  }

  async patchById(
    id: string,
    changes: UpdateQuery<TSchema>,
    populate: string[] = [],
  ): Promise<HydratedDocument<TSchema>> {
    const options: QueryOptions<TSchema> = { new: true, runValidators: true };
    const query = this.model.findByIdAndUpdate(id, changes, options);
    for (const path of populate) query.populate(path);

    const updated = (await query.exec()) as HydratedDocument<TSchema> | null;
    if (!updated) throw new ResourceNotFoundError(this.resourceName, id);
    return updated;
  }

  async upsertOne(
    filter: FilterQuery<TSchema>,
    changes: UpdateQuery<TSchema>,
  ): Promise<HydratedDocument<TSchema>> {
    const document = await this.model
      .findOneAndUpdate(filter, changes, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true })
      .exec();

    return document as unknown as HydratedDocument<TSchema>;
  }

  async removeById(id: string): Promise<void> {
    const outcome = await this.model.findByIdAndDelete(id).exec();
    if (!outcome) throw new ResourceNotFoundError(this.resourceName, id);
  }

  async removeMany(filter: FilterQuery<TSchema>): Promise<number> {
    const outcome = await this.model.deleteMany(filter).exec();
    return outcome.deletedCount ?? 0;
  }

  /** Escape hatch for reporting queries that genuinely need the pipeline. */
  protected async aggregate<TResult>(pipeline: PipelineStage[]): Promise<TResult[]> {
    return this.model.aggregate<TResult>(pipeline).exec();
  }
}
