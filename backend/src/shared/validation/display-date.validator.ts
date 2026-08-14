import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

import { isDisplayDate } from '../utils/calendar';

/**
 * `@IsDisplayDate()` — accepts the `"12 Sep 2026"` shape the UI renders and
 * rejects anything else, including plausible-but-wrong values such as
 * `"31 Feb 2026"` (which `Date.UTC` would silently roll over).
 */
export function IsDisplayDate(options?: ValidationOptions) {
  return function decorate(target: object, propertyName: string): void {
    registerDecorator({
      name: 'isDisplayDate',
      target: target.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown): boolean {
          return value === undefined || value === null || value === '' || isDisplayDate(value);
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must look like "12 Sep 2026"`;
        },
      },
    });
  };
}
