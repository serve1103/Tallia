import { HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from '../filters/global-exception.filter';

function createHost(jsonFn: jest.Mock) {
  return {
    switchToHttp: () => ({
      getResponse: () => ({
        status: jest.fn().mockReturnValue({ json: jsonFn }),
      }),
      getRequest: () => ({}),
    }),
  } as never;
}

describe('GlobalExceptionFilter', () => {
  const filter = new GlobalExceptionFilter();
  let jsonFn: jest.Mock;

  beforeEach(() => {
    jsonFn = jest.fn();
  });

  it('HttpException → 해당 status + code', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
    filter.catch(exception, createHost(jsonFn));
    expect(jsonFn).toHaveBeenCalledWith({
      error: { code: 'NOT_FOUND', message: 'Not Found', details: [] },
    });
  });

  it('ValidationError → VALIDATION_ERROR', () => {
    const exception = new HttpException({ message: '입력 오류', details: [{ field: 'email' }] }, HttpStatus.BAD_REQUEST);
    filter.catch(exception, createHost(jsonFn));
    const body = jsonFn.mock.calls[0][0];
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toEqual([{ field: 'email' }]);
  });

  it('일반 Error → INTERNAL_ERROR (스택 트레이스 노출 안 함)', () => {
    const exception = new Error('DB connection failed\n    at something.ts:10');
    filter.catch(exception, createHost(jsonFn));
    const body = jsonFn.mock.calls[0][0];
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toBe('서버 내부 오류가 발생했습니다');
    expect(body.error.message).not.toContain('DB connection');
    expect(body.error.message).not.toContain('at something');
  });

  it('429 → TOO_MANY_REQUESTS', () => {
    const exception = new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    filter.catch(exception, createHost(jsonFn));
    expect(jsonFn.mock.calls[0][0].error.code).toBe('TOO_MANY_REQUESTS');
  });

  it('문자열이 아닌 객체 → details 없으면 빈 배열', () => {
    const exception = new HttpException({ message: 'conflict' }, HttpStatus.CONFLICT);
    filter.catch(exception, createHost(jsonFn));
    const body = jsonFn.mock.calls[0][0];
    expect(body.error.code).toBe('CONFLICT');
    expect(body.error.details).toEqual([]);
  });
});
