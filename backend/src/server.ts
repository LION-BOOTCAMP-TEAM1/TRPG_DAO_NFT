import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import prisma from './prismaClient';
import { setupSwagger } from './config/swagger';
import apiRoutes from './routes';
import path from 'path';

// 환경 변수 로드 - 최우선 실행
dotenv.config();

// 시작 환경 로깅
console.log('==== 서버 시작 ====');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`실행 시간: ${new Date().toISOString()}`);
console.log('===================');

const app = express();
// Render.com에서는 할당된 PORT 환경 변수를 반드시 사용해야 함
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const API_PREFIX = '/api';

// CORS 설정
app.use(cors({
  origin: '*', // 개발 목적으로 임시로 모든 오리진 허용
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
    // 타임아웃 설정 (5초)
    const timeout = setTimeout(() => {
      console.log("데이터베이스 상태 체크 타임아웃");
      res.status(200).json({ // 500 대신 200 반환하여 헬스체크 실패로 인한 재시작 방지
        status: 'warning', 
        message: 'Database connection timeout, but server is running',
        timestamp: new Date().toISOString()
      });
    }, 5000);
    
    await prisma.$queryRaw`SELECT 1`;
    clearTimeout(timeout);
    
    res.status(200).json({ 
      status: 'ok', 
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    // 프로덕션 환경에서는 DB 연결 실패해도 서버는 계속 실행
    res.status(200).json({ // 500 대신 200 반환하여 헬스체크 실패로 인한 재시작 방지
      status: 'warning', 
      message: 'Database connection failed, but server is running',
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
  let server: any = null;
  
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    
    console.log(`🚀 서버 시작 준비 중... 모드: ${isProduction ? 'production' : 'development'}`);
    console.log(`🔌 사용할 포트: ${PORT}`);
    
    // 서버 먼저 시작 - 모든 인터페이스에서 수신
    server = app.listen(PORT, () => {
      console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
      console.log(`🚀 서버 URL: ${isProduction ? 'https://trpg-dao-nft.onrender.com' : `http://localhost:${PORT}`}`);
    });
    
    // 애플리케이션 종료 시 데이터베이스 연결 정상 종료
    const gracefulShutdown = async () => {
      console.log('서버를 종료합니다...');
      if (server) {
        server.close(async () => {
          try {
            await prisma.$disconnect();
            console.log('데이터베이스 연결이 안전하게 종료되었습니다.');
          } catch (error) {
            console.error('데이터베이스 연결 종료 중 오류:', error);
          }
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
      
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
    
    // 서버가 이미 시작되었다면 계속 실행
    if (server) {
      console.log('서버가 이미 실행 중입니다. 계속 실행합니다.');
    } else {
      console.log('서버를 다시 시작합니다...');
      // 5초 지연 없이 바로 재시도
      startServer();
    }
  }
}

// GC 효율을 위한 힙 최적화 힌트 (V8 엔진)
if (process.env.NODE_ENV === 'production') {
  try {
    // @ts-ignore
    global.gc && global.gc();
  } catch (e) {
    console.log('GC hook을 사용할 수 없습니다.');
  }
}

// 서버 시작
startServer();
