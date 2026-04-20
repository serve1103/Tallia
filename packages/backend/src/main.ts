import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // 보안 헤더
  app.use(helmet());

  // CORS — GET/POST만. FRONTEND_ORIGIN 쉼표 구분 리스트 + 사설 IP(dev) 허용.
  const originEnv = config.getOrThrow<string>('FRONTEND_ORIGIN');
  const explicitOrigins = originEnv.split(',').map((s) => s.trim()).filter(Boolean);
  const devLanRegexes = [
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
    /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
    /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
    /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+:\d+$/,
  ];
  app.enableCors({
    origin: [...explicitOrigins, ...devLanRegexes],
    methods: ['GET', 'POST'],
    credentials: true,
  });

  // Body 크기 제한
  app.use(cookieParser());

  // Trust Proxy
  const trustProxy = config.get<string>('TRUST_PROXY', 'loopback');
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', trustProxy);

  // API prefix
  app.setGlobalPrefix('api/v1');

  // 전역 Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // 헬스체크
  expressApp.get('/health', (_req: unknown, res: { json: (body: unknown) => void }) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // JWT 시크릿 플레이스홀더 경고
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  const placeholders = ['your-jwt-secret-key', 'your-jwt-refresh-secret-key', 'change-me-in-production'];
  if (placeholders.includes(jwtSecret as string) || placeholders.includes(jwtRefreshSecret as string)) {
    console.warn('WARNING: JWT secrets are placeholder values. Change them before production deployment!');
  }

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
}

bootstrap();
