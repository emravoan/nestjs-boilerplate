export interface PaginationMeta {
  current: number;
  last: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export class PaginatedDto<T> {
  items: T[];
  pagination: PaginationMeta;

  /**
   * Builds a paginated payload with legacy-compatible pagination metadata.
   */
  constructor(items: T[], current: number, limit: number, total: number) {
    const last = Math.ceil(total / limit);
    const hasMore = total > current * limit;

    this.items = items;
    this.pagination = {
      current,
      last,
      limit,
      total,
      hasMore,
    };
  }
}
