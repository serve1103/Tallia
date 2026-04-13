import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import type { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const details = this.formatErrors(result.error);
      throw new BadRequestException({
        message: '입력 검증에 실패했습니다',
        details,
      });
    }

    return result.data;
  }

  private formatErrors(error: ZodError): { field: string; message: string }[] {
    return error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
  }
}
