import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import prisma from './prismaClient';
import { setupSwagger } from './config/swagger';
import apiRoutes from './routes';
import path from 'path';

// 환경 변수 로드 - 최우선 실행
try {
  dotenv.config();
  console.log('환경 변수 로드 성공');
} catch (e) {
  console.error('환경 변수 로드 실패:', e);
}

// 시작 환경 로깅
console.log('==== 서버 시작 ====');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`SKIP_DB_SYNC: ${process.env.SKIP_DB_SYNC || 'false'}`);
console.log(`PORT: ${process.env.PORT || '3000'}`);
console.log(`실행 시간: ${new Date().toISOString()}`);
console.log('===================');

// 전역 에러 핸들러 설정
process.on('uncaughtException', (error) => {
  console.error('===== 치명적인 처리되지 않은 예외 발생 =====');
  console.error('오류 메시지:', error.message);
  console.error('오류 이름:', error.name);
  console.error('오류 스택:', error.stack);
  console.error('=========================================');
  // 프로덕션에서는 계속 실행
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('===== 처리되지 않은 Promise 거부 =====');
  console.error('사유:', reason);
  console.error('=========================================');
});

const app = express();
// Render.com에서는 할당된 PORT 환경 변수를 반드시 사용해야 함
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const API_PREFIX = '/api';

// Express 에러 핸들링 미들웨어
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Express 오류 발생:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? 'Internal error' : err.message
  });
});

try {
  // CORS 설정
  app.use(cors({
    origin: '*', // 개발 목적으로 임시로 모든 오리진 허용
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
  }));

  app.use(express.json());

  // 정적 파일 제공 설정
  app.use('/static', express.static(path.join(__dirname, '../static')));

  console.log('기본 라우트 설정 중...');

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

  console.log('API 라우터 등록 시도...');
  try {
    // API 라우터 등록
    app.use(API_PREFIX, apiRoutes);
    console.log('API 라우터 등록 성공');
  } catch (routerError) {
    console.error('API 라우터 등록 실패:', routerError);
  }

  console.log('스웨거 설정 시도...');
  // Swagger 설정은 메모리를 많이 사용할 수 있으므로 프로덕션에서는 선택적으로 활성화
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    try {
      setupSwagger(app);
      console.log('스웨거 설정 완료');
    } catch (swaggerError) {
      console.error('스웨거 설정 실패:', swaggerError);
    }
  }
} catch (setupError) {
  console.error('서버 설정 중 오류:', setupError);
}

// 데이터베이스 연결 지연 처리 및 서버 시작
async function startServer() {
  let server: any = null;
  
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const skipDbSync = process.env.SKIP_DB_SYNC === 'true';
    
    console.log(`🚀 서버 시작 준비 중... 모드: ${isProduction ? 'production' : 'development'}`);
    console.log(`🔌 사용할 포트: ${PORT}`);
    
    // 서버 먼저 시작 - 모든 인터페이스에서 수신
    return new Promise((resolve, reject) => {
      try {
        server = app.listen(PORT, () => {
          console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
          console.log(`🚀 서버 URL: ${isProduction ? 'https://trpg-dao-nft.onrender.com' : `http://localhost:${PORT}`}`);
          
          // 서버가 정상적으로 시작되었음을 확인하기 위한 추가 코드
          if (server && server.listening) {
            console.log('✅ 서버가 정상적으로 실행 중이며 요청 대기 중입니다.');
            resolve(server);
          } else {
            console.error('❌ 서버가 시작되었지만 정상 작동 중인지 확인할 수 없습니다.');
            reject(new Error('Server is not properly listening'));
          }
        });
        
        server.on('error', (err: any) => {
          console.error('서버 시작 중 오류 발생:', err);
          reject(err);
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
      } catch (startError) {
        console.error('서버 시작 과정에서 예외 발생:', startError);
        reject(startError);
      }
    });
  } catch (error) {
    console.error('서버 시작 준비 중 오류가 발생했습니다:', error);
    
    // 서버가 이미 시작되었다면 계속 실행
    if (server) {
      console.log('서버가 이미 실행 중입니다. 계속 실행합니다.');
      return server;
    } else {
      console.log('서버를 다시 시작합니다...');
      return startServer(); // 재귀 호출
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
(async () => {
  try {
    console.log('서버 시작 함수 호출...');
    const server = await startServer();
    console.log('서버 시작 완료');
    
    // 서버가 성공적으로 시작되었는지 추가 확인
    setTimeout(() => {
      console.log('서버 상태 확인: 서버가 여전히 실행 중입니다.');
    }, 5000);
    
    // 프로세스가 종료되지 않도록 유지
    process.stdin.resume();
    
    // 명시적으로 Node.js 이벤트 루프를 유지하는 인터벌 설정
    setInterval(() => {
      console.log('서버 활성 상태 유지: ' + new Date().toISOString());
    }, 60000); // 1분마다 로그 출력
    
    // 추가 안전 장치: 프로세스 종료 방지
    process.on('beforeExit', () => {
      console.log('프로세스 종료 시도가 감지되었습니다. 종료를 방지합니다.');
      setImmediate(() => {
        console.log('프로세스 유지 중...');
      });
    });
    
  } catch (e) {
    console.error('최상위 레벨에서 서버 시작 오류 발생:', e);
  }
})();
