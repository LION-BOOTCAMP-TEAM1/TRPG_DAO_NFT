import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import prisma from './prismaClient';
import { setupSwagger } from './config/swagger';
import apiRoutes from './routes';
import { syncDatabase, runSeed } from './utils/dbSync';
import path from 'path';

dotenv.config();

const app = express();
// Render.com은 PORT 환경 변수를 사용합니다. 이 값이 필요합니다.
const PORT = parseInt(process.env.PORT || '10000', 10); // string을 number로 변환
const API_PREFIX = '/api';

// 환경 변수 디버깅 로그
console.log('환경 변수 정보:');
console.log(`PORT: ${process.env.PORT}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
// DATABASE_URL은 민감 정보이므로 전체를 로깅하지 않고 일부만 확인
console.log(`DATABASE_URL이 설정됨: ${!!process.env.DATABASE_URL}`);
if (process.env.DATABASE_URL) {
  console.log(`DATABASE_URL 시작 부분: ${process.env.DATABASE_URL.substring(0, 20)}...`);
}

// CORS 설정
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com', 'https://trpg-dao-nft.onrender.com']
    : 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

app.use(express.json());

// 정적 파일 제공 설정
app.use('/static', express.static(path.join(__dirname, '../static')));

// 기본 상태 체크 엔드포인트
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 데이터베이스 상태 체크 엔드포인트
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ 
      status: 'ok', 
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// API 라우터 등록
app.use(API_PREFIX, apiRoutes);

// Swagger 설정은 메모리를 많이 사용할 수 있으므로 프로덕션에서는 선택적으로 활성화
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
  setupSwagger(app);
}

// 데이터베이스 연결 지연 처리 및 서버 시작
async function startServer() {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    
    console.log(`🚀 서버 시작 준비 중... 모드: ${isProduction ? 'production' : 'development'}`);
    console.log(`🔌 사용할 포트: ${PORT}`);
    
    // 서버 먼저 시작
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
      console.log(`🚀 서버 URL: ${isProduction ? 'https://trpg-dao-nft.onrender.com' : `http://localhost:${PORT}`}`);
    });
    
    // 서버가 시작된 후 DB 연결 시도 - 에러 처리 강화
    console.log('데이터베이스 연결 확인 중...');
    
    // 데이터베이스 연결 타임아웃 설정 (10초)
    const dbConnectionTimeout = setTimeout(() => {
      console.warn('⚠️ 데이터베이스 연결 시간 초과. 서버는 계속 실행됩니다.');
    }, 10000);
    
    try {
      // 간단한 쿼리로 연결 테스트
      await prisma.$queryRaw`SELECT 1`;
      clearTimeout(dbConnectionTimeout);
      console.log('✅ 데이터베이스 연결 성공!');
    } catch (dbError) {
      clearTimeout(dbConnectionTimeout);
      console.error('⚠️ 데이터베이스 연결 실패:', dbError);
      console.log('기본 기능은 계속 작동하지만 데이터베이스 기능이 제한됩니다.');
      
      // 에러 세부 정보 로깅
      if (dbError instanceof Error) {
        console.error('에러 메시지:', dbError.message);
        console.error('에러 스택:', dbError.stack);
      } else {
        console.error('알 수 없는 에러:', dbError);
      }
      
      // 데이터베이스 연결 실패해도 서버는 계속 실행 (중요)
    }
    
    // 시드 데이터는 API 엔드포인트를 통해 수동으로 적용하도록 변경
    // SEED_ON_START 옵션은 비활성화
    
    // 애플리케이션 종료 시 데이터베이스 연결 정상 종료
    const gracefulShutdown = async () => {
      console.log('서버를 종료합니다...');
      server.close(async () => {
        try {
          await prisma.$disconnect();
          console.log('데이터베이스 연결이 안전하게 종료되었습니다.');
        } catch (error) {
          console.error('데이터베이스 연결 종료 중 오류:', error);
        }
        process.exit(0);
      });
      
      // 10초 후에도 종료되지 않으면 강제 종료
      setTimeout(() => {
        console.error('서버가 10초 내에 정상 종료되지 않아 강제 종료합니다.');
        process.exit(1);
      }, 10000);
    };
    
    // SIGTERM, SIGINT 시그널 처리
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
    // 예상치 못한 예외 처리
    process.on('uncaughtException', (error) => {
      console.error('처리되지 않은 예외 발생:', error);
      console.error('서버는 계속 실행됩니다.');
      // 치명적인 에러가 아니면 계속 실행
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('처리되지 않은 Promise 거부:', reason);
      console.error('서버는 계속 실행됩니다.');
      // 치명적인 에러가 아니면 계속 실행
    });
    
  } catch (error) {
    console.error('서버 시작 중 오류가 발생했습니다:', error);
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('데이터베이스 연결 종료 중 오류:', disconnectError);
    }
    
    // 오류 발생해도 서버는 계속 시도
    console.log('오류에도 불구하고 서버를 다시 시작합니다...');
    startServer(); // 다시 시도
  }
}

// GC 효율을 위한 힙 최적화 힌트 (V8 엔진)
if (process.env.NODE_ENV === 'production') {
  try {
    // @ts-ignore
    global.gc && global.gc();
  } catch (e) {
    console.log('No GC hook');
  }
}

startServer();
