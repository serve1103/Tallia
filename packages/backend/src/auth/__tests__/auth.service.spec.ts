import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../service/auth.service';
import type { AuthRepository, UserEntity } from '../repository/auth.repository';

const mockUser: UserEntity = {
  id: 'user-1',
  tenantId: 'tenant-1',
  email: 'test@korea.ac.kr',
  // bcrypt hash of 'password123'
  passwordHash: '$2b$12$LJ3/E4lK7Gk8Rp7VH5wYyOzK6Z5U5w5F6Z5U5w5F6Z5U5w5F6Z5U',
  name: '홍길동',
  role: 'tenant_admin',
  emailVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createMockRepo(): jest.Mocked<AuthRepository> {
  return {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateEmailVerified: jest.fn(),
    updatePassword: jest.fn(),
  };
}

function createMockJwt(): jest.Mocked<Pick<JwtService, 'sign' | 'verify'>> {
  return {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn(),
  };
}

function createMockConfig(): jest.Mocked<Pick<ConfigService, 'getOrThrow' | 'get'>> {
  return {
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
    get: jest.fn().mockReturnValue('test-secret'),
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let repo: jest.Mocked<AuthRepository>;
  let jwt: jest.Mocked<Pick<JwtService, 'sign' | 'verify'>>;

  beforeEach(() => {
    repo = createMockRepo();
    jwt = createMockJwt();
    const config = createMockConfig();
    service = new AuthService(repo, jwt as unknown as JwtService, config as unknown as ConfigService);
  });

  describe('signup', () => {
    it('신규 사용자 생성 성공', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue({ ...mockUser, id: 'new-user' });

      const result = await service.signup('new@test.com', 'password123', '새사용자');
      expect(result.userId).toBe('new-user');
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
        email: 'new@test.com',
        name: '새사용자',
        role: 'tenant_admin',
      }));
    });

    it('이미 등록된 이메일 → ConflictException', async () => {
      repo.findByEmail.mockResolvedValue(mockUser);
      await expect(service.signup('test@korea.ac.kr', 'password123', '홍길동'))
        .rejects.toThrow(ConflictException);
    });

    it('비밀번호는 bcrypt로 해싱', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockUser);

      await service.signup('new@test.com', 'password123', 'test');
      const createCall = repo.create.mock.calls[0][0];
      expect(createCall.passwordHash).not.toBe('password123');
      expect(createCall.passwordHash).toMatch(/^\$2[aby]\$/); // bcrypt prefix
    });
  });

  describe('login', () => {
    it('이메일 없음 → UnauthorizedException', async () => {
      repo.findByEmail.mockResolvedValue(null);
      await expect(service.login('noone@test.com', 'password123'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('비밀번호 불일치 → UnauthorizedException', async () => {
      repo.findByEmail.mockResolvedValue(mockUser);
      await expect(service.login('test@korea.ac.kr', 'wrong-password'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('유효하지 않은 토큰 → UnauthorizedException', async () => {
      jwt.verify.mockImplementation(() => { throw new Error('invalid'); });
      await expect(service.refresh('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('유효한 토큰 + 사용자 존재 → 새 토큰 발급', async () => {
      jwt.verify.mockReturnValue({ sub: 'user-1', tenantId: 'tenant-1', role: 'tenant_admin' });
      repo.findById.mockResolvedValue(mockUser);

      const result = await service.refresh('valid-refresh-token');
      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
    });

    it('유효한 토큰 + 사용자 없음 → UnauthorizedException', async () => {
      jwt.verify.mockReturnValue({ sub: 'deleted-user', tenantId: null, role: 'tenant_admin' });
      repo.findById.mockResolvedValue(null);
      await expect(service.refresh('valid-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyEmail', () => {
    it('이메일 인증 업데이트', async () => {
      await service.verifyEmail('user-1');
      expect(repo.updateEmailVerified).toHaveBeenCalledWith('user-1', true);
    });
  });

  describe('forgotPassword', () => {
    it('존재하지 않는 이메일도 성공 응답 (정보 노출 방지)', async () => {
      repo.findByEmail.mockResolvedValue(null);
      await expect(service.forgotPassword('noone@test.com')).resolves.not.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('사용자 없음 → NotFoundException', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.resetPassword('bad-id', 'newpass123')).rejects.toThrow();
    });

    it('비밀번호 변경 성공', async () => {
      repo.findById.mockResolvedValue(mockUser);
      await service.resetPassword('user-1', 'newpass123');
      expect(repo.updatePassword).toHaveBeenCalledWith('user-1', expect.stringMatching(/^\$2[aby]\$/));
    });
  });
});
