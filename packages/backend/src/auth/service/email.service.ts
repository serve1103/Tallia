import { Injectable, Logger } from '@nestjs/common';

/**
 * 이메일 발송 서비스 (stub)
 * 실제 발송은 인프라 확정 후 구현 (§8 미결사항)
 * 현재는 로그만 출력
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    this.logger.log(`[STUB] 인증 이메일 발송: ${to}, token=${token.substring(0, 8)}...`);
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    this.logger.log(`[STUB] 비밀번호 재설정 이메일 발송: ${to}, token=${token.substring(0, 8)}...`);
  }

  async sendInviteEmail(to: string, inviteCode: string, tenantName: string): Promise<void> {
    this.logger.log(`[STUB] 초대 이메일 발송: ${to}, tenant=${tenantName}, code=${inviteCode}`);
  }
}
