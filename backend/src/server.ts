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
const PORT = process.env.PORT || 5001;
const API_PREFIX = '/api';

// CORS 설정
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com', 'https://trpg-dao-nft.onrender.com']
    : 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 정적 파일 제공 설정
app.use('/static', express.static(path.join(__dirname, '../static')));

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
    
    console.log(`🚀 Server running on ${isProduction ? 'production' : 'development'} mode`);
    
    // 서버 먼저 시작
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server URL: ${isProduction ? 'https://trpg-dao-nft.onrender.com' : `http://localhost:${PORT}`}`);
    });
    
    // 서버가 시작된 후 DB 연결 시도
    console.log('데이터베이스 연결 확인 중...');
    
    try {
      // 간단한 쿼리로 연결 테스트
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ 데이터베이스 연결 성공!');
    } catch (dbError) {
      console.error('⚠️ 데이터베이스 연결 실패:', dbError);
      console.log('기본 기능은 계속 작동하지만 데이터베이스 기능이 제한될 수 있습니다.');
      // 데이터베이스 연결 실패해도 서버는 계속 실행
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
    
  } catch (error) {
    console.error('서버 시작 중 오류가 발생했습니다:', error);
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('데이터베이스 연결 종료 중 오류:', disconnectError);
    }
    process.exit(1);
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
