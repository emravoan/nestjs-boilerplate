import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { EntityManager } from 'typeorm';

export type IsAutoIncrementalOptions = {
  table: string;
  column?: string;
  relations?: Record<string, string>;
};

/**
 * Resolves nested DTO values using dot-notation paths (e.g., "video.id").
 */
function resolveNestedValue(target: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }

    return undefined;
  }, target);
}

@Injectable()
@ValidatorConstraint({ name: 'isAutoIncremental', async: true })
export class IsAutoIncrementalConstraint implements ValidatorConstraintInterface {
  constructor(private readonly entityManager: EntityManager) {}

  /**
   * Auto-assigns next incremental value for sortable columns on create flows.
   */
  async validate(_: unknown, args: ValidationArguments): Promise<boolean> {
    const [options] = args.constraints as [IsAutoIncrementalOptions];
    const field = options.column || args.property;
    const entity = args.object as Record<string, unknown>;

    /**
     * Skips auto-assignment on update requests.
     */
    if (typeof entity.id === 'number' && entity.id > 0) {
      return true;
    }

    /**
     * If caller sets a non-zero value explicitly, keep it.
     */
    const existingValue = entity[field];
    if (typeof existingValue === 'number' && existingValue !== 0) {
      return true;
    }

    if (typeof existingValue === 'string' && existingValue.trim() !== '' && existingValue !== '0') {
      return true;
    }

    const qb = this.entityManager
      .getRepository(options.table)
      .createQueryBuilder(options.table)
      .select(`MAX(${options.table}.${field})`, 'max');

    for (const [dbColumn, dtoPath] of Object.entries(options.relations ?? {})) {
      const value = resolveNestedValue(entity, dtoPath);
      qb.andWhere(`${options.table}.${dbColumn} = :${dbColumn}`, { [dbColumn]: value });
    }

    const query = await qb.getRawOne<{ max?: number | string | null }>();
    const maxValue = Number(query?.max || 0);
    entity[field] = maxValue + 1;

    return true;
  }

  /**
   * Returns a fallback message for auto-increment computation failures.
   */
  defaultMessage(args: ValidationArguments): string {
    return `${args.property} could not be auto-incremented`;
  }
}

/**
 * Decorator for auto-assigning next incremental values by scope.
 */
export function IsAutoIncremental(
  options: IsAutoIncrementalOptions,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName.toString(),
      options: validationOptions,
      constraints: [options],
      validator: IsAutoIncrementalConstraint,
    });
  };
}
