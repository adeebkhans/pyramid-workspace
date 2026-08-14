import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

import { isDateRangeInvalid } from '../utils/calendar';

/**
 * `@IsValidDateRange()` — validates that `dueDate` is not before `startDate`
 * when both are provided. Place on the class (not a single property).
 */
export function IsValidDateRange(options?: ValidationOptions) {
  return function decorate(target: object, propertyName: string): void {
    registerDecorator({
      name: 'isValidDateRange',
      target: target.constructor,
      propertyName,
      options,
      validator: {
        validate(_value: unknown, args: ValidationArguments): boolean {
          const object = args.object as Record<string, unknown>;
          return !isDateRangeInvalid(object['startDate'] as string | null | undefined, object['dueDate'] as string | null | undefined);
        },
        defaultMessage(): string {
          return 'dueDate must not be before startDate';
        },
      },
    });
  };
}
