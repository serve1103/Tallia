import { config } from 'dotenv';
import { resolve } from 'path';

// 테스트 실행 전 .env.test 로드 (테스트 전용 DB 분리)
config({ path: resolve(__dirname, '.env.test') });
