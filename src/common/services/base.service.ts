import { NotFoundException } from '@nestjs/common';
import { DeepPartial, FindManyOptions, FindOptionsWhere, In, ObjectLiteral, Repository } from 'typeorm';

import { PaginatedDto } from '../dto/paginated.dto';
import { QueryDto } from '../dto/query.dto';

export class BaseService<T extends ObjectLiteral & { id: number }> {
  constructor(protected readonly repository: Repository<T>) {}

  protected relations: string[] = [];

  /**
   * Returns paginated entities with optional relations and relation counts.
   */
  async paginate(query: QueryDto, options: FindManyOptions<T> = {}): Promise<PaginatedDto<T>> {
    const { page = 1, limit = 10, include = [], includeCount = [] } = query;

    const selfRelations = Array.isArray(this.relations) ? this.relations : [];
    const optionRelations = Array.isArray(options.relations) ? options.relations : [];

    const [items, total] = await this.repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      ...options,
      relations: Array.from(new Set([...include, ...selfRelations, ...optionRelations])),
    });

    if (items.length && includeCount.length) {
      for (const relationName of includeCount) {
        const relationCounts = await this.repository
          .createQueryBuilder('entity')
          .select('entity.id', 'id')
          .addSelect(`COUNT(${relationName}.id)`, 'count')
          .leftJoin(`entity.${relationName}`, relationName)
          .whereInIds(items.map((item) => item.id))
          .groupBy('entity.id')
          .getRawMany<{ id: number; count: number }>();

        const countById = new Map(relationCounts.map((row) => [Number(row.id), Number(row.count)]));

        items.forEach((item) => {
          (item as Record<string, unknown>)[`${relationName}Count`] = countById.get(item.id) ?? 0;
        });
      }
    }

    return new PaginatedDto<T>(items, page, limit, total);
  }

  /**
   * Finds one entity by arbitrary where clause.
   */
  findOneBy(where: FindOptionsWhere<T>): Promise<T | null> {
    return this.repository.findOne({ where });
  }

  /**
   * Finds one entity or throws a 404-style error.
   */
  findOneByOrFail(where: FindOptionsWhere<T>, message = 'The item does not exist'): Promise<T> {
    return this.findOneBy(where).then((item) => {
      if (!item) {
        throw new NotFoundException(message);
      }
      return item;
    });
  }

  /**
   * Finds multiple entities by IDs and returns paginated result.
   */
  async findByIds(ids: number[], page: number = 1, limit: number = 10): Promise<PaginatedDto<T>> {
    if (!ids.length) {
      return new PaginatedDto<T>([], page, limit, 0);
    }

    const where: FindOptionsWhere<T> = { id: In(ids) } as any;
    const [items, total] = await this.repository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      relations: this.relations,
    });

    return new PaginatedDto<T>(items, page, limit, total);
  }

  /**
   * Finds one entity by ID.
   */
  findOneById(id: number): Promise<T | null> {
    return this.repository.findOne({
      where: { id } as any,
      relations: this.relations,
    });
  }

  /**
   * Finds one entity by a specific field.
   */
  findOneByField(field: keyof T, value: string | number): Promise<T | null> {
    return this.repository.findOne({
      where: { [field]: value } as FindOptionsWhere<T>,
      relations: this.relations,
    });
  }

  /**
   * Creates an entity instance and persists it.
   */
  create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  /**
   * Updates an entity by ID and returns the refreshed record.
   */
  async update(id: number, data: DeepPartial<T>): Promise<T> {
    const entity = await this.repository.preload({ id, ...data } as DeepPartial<T> & { id: number });
    if (!entity) {
      throw new NotFoundException('The item does not exist');
    }

    const saved = await this.repository.save(entity);
    return this.findOneById(saved.id) as Promise<T>;
  }

  /**
   * Deletes one entity by ID and returns the deleted record.
   */
  async delete(id: number): Promise<T> {
    const item = await this.repository.findOne({ where: { id } as any });
    if (!item) {
      throw new NotFoundException('The item does not exist');
    }

    await this.repository.remove(item);
    return item;
  }

  /**
   * Alias for delete to keep backward-compatible service contracts.
   */
  remove: (id: number) => Promise<T> = this.delete.bind(this);
}
