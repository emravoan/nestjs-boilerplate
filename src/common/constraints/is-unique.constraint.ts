import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DataSource, EntityTarget, Not, ObjectLiteral } from 'typeorm';

export type IsUniqueOptions = {
  entity?: EntityTarget<ObjectLiteral>;
  table?: string;
  column?: string;
  message?: string | ((validationArguments: ValidationArguments) => string);
  foreignColumn?: string;
  foreignValuePath?: string;
  ignoreIdField?: string;
  idColumn?: string;
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
@ValidatorConstraint({ name: 'isUnique', async: true })
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Validates uniqueness for the configured entity/table column.
   */
  async validate(value: unknown, args: ValidationArguments): Promise<boolean> {
    if (value === null || value === undefined || value === '') {
      return true;
    }

    const [options] = args.constraints as [IsUniqueOptions];
    const field = options.column || args.property;
    const idColumn = options.idColumn || 'id';
    const entity = args.object as Record<string, unknown>;

    const repository = options.entity
      ? this.dataSource.getRepository(options.entity)
      : this.dataSource.getRepository(options.table as EntityTarget<ObjectLiteral>);

    const where: Record<string, unknown> = {
      [field]: value,
    };

    if (options.foreignColumn && options.foreignValuePath) {
      where[options.foreignColumn] = resolveNestedValue(entity, options.foreignValuePath);
    }

    if (entity[idColumn] !== undefined && entity[idColumn] !== null && entity[idColumn] !== '') {
      where[idColumn] = Not(entity[idColumn]);
    } else if (options.ignoreIdField) {
      const ignoreId = entity[options.ignoreIdField];
      if (ignoreId !== undefined && ignoreId !== null && ignoreId !== '') {
        where[idColumn] = Not(ignoreId);
      }
    }

    const exists = await repository.exist({ where: where as any });
    return !exists;
  }

  /**
   * Returns a uniqueness violation message.
   */
  defaultMessage(args: ValidationArguments): string {
    const [options] = args.constraints as [IsUniqueOptions];
    if (typeof options.message === 'function') {
      return options.message(args);
    }

    return options.message || `${options.column || args.property} has already been taken`;
  }
}

/**
 * Decorator for async uniqueness validation.
 */
export function IsUnique(options: IsUniqueOptions, validationOptions?: ValidationOptions): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isUnique',
      target: object.constructor,
      propertyName: propertyName.toString(),
      options: validationOptions,
      constraints: [options],
      validator: IsUniqueConstraint,
    });
  };
}
