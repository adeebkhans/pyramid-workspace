import { Injectable, PipeTransform } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';

import { InvalidIdentifierError } from '../errors/domain.errors';

/**
 * Rejects malformed identifiers at the edge so services never have to guard
 * against a `CastError` bubbling up from the driver.
 */
@Injectable()
export class ObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isValidObjectId(value)) {
      throw new InvalidIdentifierError(value);
    }
    return value;
  }
}
