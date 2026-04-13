import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1),
  });

  const pipe = new ZodValidationPipe(schema);

  it('유효한 입력 → 변환된 데이터 반환', () => {
    const input = { email: 'test@test.com', password: '12345678', name: '홍길동' };
    expect(pipe.transform(input)).toEqual(input);
  });

  it('이메일 형식 오류 → BadRequestException', () => {
    expect(() => pipe.transform({ email: 'invalid', password: '12345678', name: 'test' }))
      .toThrow(BadRequestException);
  });

  it('비밀번호 너무 짧음 → BadRequestException', () => {
    expect(() => pipe.transform({ email: 'test@test.com', password: '123', name: 'test' }))
      .toThrow(BadRequestException);
  });

  it('필수 필드 누락 → BadRequestException', () => {
    expect(() => pipe.transform({ email: 'test@test.com' }))
      .toThrow(BadRequestException);
  });

  it('에러 메시지에 필드 정보 포함', () => {
    try {
      pipe.transform({ email: 'invalid', password: '1', name: '' });
    } catch (e) {
      const response = (e as BadRequestException).getResponse() as { details: { field: string }[] };
      const fields = response.details.map((d) => d.field);
      expect(fields).toContain('email');
      expect(fields).toContain('password');
    }
  });

  it('추가 필드는 무시 (strip)', () => {
    const input = { email: 'test@test.com', password: '12345678', name: '홍길동', extra: 'ignored' };
    const result = pipe.transform(input);
    expect(result).not.toHaveProperty('extra');
  });
});
