import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';

export type IsExistingIdsOptions = {
  entity?: EntityTarget<ObjectLiteral>;
  table?: string;
  column?: string;
  message?: string | ((validationArguments: ValidationArguments) => string);
  foreignColumn?: string;
  foreignValuePath?: string;
  allowEmpty?: boolean;
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
@ValidatorConstraint({ name: 'isExistingIds', async: true })
export class IsExistingIdsConstraint implements ValidatorConstraintInterface {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Validates that provided ID values exist in the target entity scope.
   */
  async validate(value: unknown, args: ValidationArguments): Promise<boolean> {
    if (value === undefined || value === null) {
      return true;
    }

    const [options] = args.constraints as [IsExistingIdsOptions];
    const field = options.column || 'id';

    const idsRaw = Array.isArray(value) ? value : [value];
    if (idsRaw.length === 0) {
      return options.allowEmpty ?? true;
    }

    const ids = idsRaw.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0);
    if (ids.length !== idsRaw.length) {
      return false;
    }

    const repository = options.entity
      ? this.dataSource.getRepository(options.entity)
      : this.dataSource.getRepository(options.table as EntityTarget<ObjectLiteral>);

    const alias = 'entity';
    const query = repository
      .createQueryBuilder(alias)
      .select(`${alias}.${field}`, 'value')
      .where(`${alias}.${field} IN (:...ids)`, { ids: Array.from(new Set(ids)) });

    if (options.foreignColumn && options.foreignValuePath) {
      const entity = args.object as Record<string, unknown>;
      const foreignValue = resolveNestedValue(entity, options.foreignValuePath);
      query.andWhere(`${alias}.${options.foreignColumn} = :foreignValue`, { foreignValue });
    }

    const rows = await query.getRawMany<{ value: number | string }>();
    return rows.length === Array.from(new Set(ids)).length;
  }

  /**
   * Returns a default invalid-ID message.
   */
  defaultMessage(args: ValidationArguments): string {
    const [options] = args.constraints as [IsExistingIdsOptions];
    if (typeof options.message === 'function') {
      return options.message(args);
    }

    return options.message || `the provided ID(s) for '${args.property}' do not exist`;
  }
}

/**
 * Decorator for validating ID-array existence in a target entity.
 */
export function IsExistingIds(options: IsExistingIdsOptions, validationOptions?: ValidationOptions): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isExistingIds',
      target: object.constructor,
      propertyName: propertyName.toString(),
      options: validationOptions,
      constraints: [options],
      validator: IsExistingIdsConstraint,
    });
  };
}
