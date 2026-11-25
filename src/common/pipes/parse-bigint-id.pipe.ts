import {
  ArgumentMetadata,
  HttpException,
  HttpStatus,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ErrorCode, HttpUserMessage } from '../http/http-messages';

@Injectable()
export class ParseBigIntIdPipe implements PipeTransform<string, string> {
  transform(value: string, _metadata: ArgumentMetadata): string {
    if (!/^\d+$/.test(value)) {
      throw new HttpException(
        {
          message: HttpUserMessage.VALIDATION,
          code: ErrorCode.VALIDATION_ERROR,
          details: [{ field: 'id', message: 'id must be a positive integer' }],
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return value;
  }
}
