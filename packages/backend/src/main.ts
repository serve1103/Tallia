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

  // CORS — GET/POST만, 프론트엔드 도메인만
  app.enableCors({
    origin: config.getOrThrow<string>('FRONTEND_ORIGIN'),
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

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
}

bootstrap();
