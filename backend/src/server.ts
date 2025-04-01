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

// Render 환경 감지 로직 통합
const isRenderEnv =
  process.env.IS_RENDER === 'true' || process.env.RENDER === 'true';
console.log(`Render 환경 감지: ${isRenderEnv}`);

// 시작 환경 로깅
console.log('==== 서버 시작 ====');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`SKIP_DB_SYNC: ${process.env.SKIP_DB_SYNC || 'false'}`);
console.log(`PORT: ${process.env.PORT || '3000'}`);
console.log(`실행 시간: ${new Date().toISOString()}`);
console.log('===================');

// Render 진단 정보 로깅
console.log('==== Render 진단 정보 ====');
console.log('환경변수 상세:');
[
  'NODE_ENV',
  'PORT',
  'SKIP_DB_SYNC',
  'IS_RENDER',
  'RENDER',
  'DATABASE_URL',
  'DATABASE_URL_UNPOOLED',
].forEach((key) => {
  const value = process.env[key];
  console.log(
    `${key}: ${value ? (key.includes('DATABASE') ? '설정됨(값 숨김)' : value) : '설정안됨'}`
  );
});
console.log('========================');

// 메모리 진단 정보 추가
const memoryUsage = process.memoryUsage();
console.log('==== 메모리 진단 정보 ====');
console.log(`RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB`);
console.log(`Heap: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}/${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`);
console.log('========================');

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
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Express 오류 발생:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error:
        process.env.NODE_ENV === 'production' ? 'Internal error' : err.message,
    });
  }
);

try {
  // CORS 설정
  app.use(
    cors({
      origin: '*', // 개발 목적으로 임시로 모든 오리진 허용
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    })
  );

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
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // 데이터베이스 상태 체크 엔드포인트
  app.get('/health', async (req, res) => {
    try {
      // 타임아웃 설정 (5초)
      const timeout = setTimeout(() => {
        console.log('데이터베이스 상태 체크 타임아웃');
        res.status(200).json({
          // 500 대신 200 반환하여 헬스체크 실패로 인한 재시작 방지
          status: 'warning',
          message: 'Database connection timeout, but server is running',
          timestamp: new Date().toISOString(),
        });
      }, 5000);

      // Neon 최적화를 위한 간단한 쿼리 사용
      await prisma.$queryRaw`SELECT 1`;
      clearTimeout(timeout);

      // 현재 메모리 상태 검사
      const memUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
      const rss = Math.round(memUsage.rss / 1024 / 1024);

      res.status(200).json({
        status: 'ok',
        message: 'Database connection successful',
        timestamp: new Date().toISOString(),
        memory: {
          rss: `${rss}MB`,
          heapUsed: `${heapUsedMB}MB`,
          heapTotal: `${heapTotalMB}MB`,
          heapUsage: `${Math.round((heapUsedMB / heapTotalMB) * 100)}%`
        }
      });
    } catch (error) {
      console.error('Health check failed:', error);
      // 프로덕션 환경에서는 DB 연결 실패해도 서버는 계속 실행
      res.status(200).json({
        // 500 대신 200 반환하여 헬스체크 실패로 인한 재시작 방지
        status: 'warning',
        message: 'Database connection failed, but server is running',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
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

  // 환경 설정에 따라 선택적으로 기능 활성화
  const enableSwagger =
    process.env.DISABLE_SWAGGER !== 'true' &&
    (process.env.NODE_ENV !== 'production' ||
      process.env.ENABLE_SWAGGER === 'true');

  // 메모리 진단 모드 확인
  const isMemoryDiagnostics = process.env.MEMORY_DIAGNOSTICS === 'true';

  // 스웨거 설정은 선택적으로 활성화
  if (enableSwagger) {
    try {
      setupSwagger(app);
      console.log('스웨거 설정 완료');
    } catch (swaggerError) {
      console.error('스웨거 설정 실패:', swaggerError);
    }
  } else {
    console.log('스웨거 설정 건너뜀 (비활성화됨)');
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

    console.log(
      `🚀 서버 시작 준비 중... 모드: ${isProduction ? 'production' : 'development'}`
    );
    console.log(`🔌 사용할 포트: ${PORT}`);

    // 서버 먼저 시작 - 모든 인터페이스에서 수신
    return new Promise((resolve, reject) => {
      try {
        const serverStartTime = Date.now();
        server = app.listen(PORT, () => {
          console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
          console.log(
            `🚀 서버 URL: ${isProduction ? 'https://trpg-dao-nft.onrender.com' : `http://localhost:${PORT}`}`
          );

          // 명시적 GC 호출로 시작 메모리 정리
          if (typeof global.gc === 'function') {
            global.gc();
            console.log('초기 GC 호출 완료');
          }

          // 무거운 초기화 작업 지연 로드 (5초로 단축)
          setTimeout(() => {
            console.log('지연된 초기화 작업 완료');
            resolve(server);
          }, 5000);
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
            console.error(
              '서버가 10초 내에 정상 종료되지 않아 강제 종료합니다.'
            );
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

// GC 접근을 위한 타입 확장
declare global {
  interface Global {
    gc?: () => void;
  }
}

// GC 효율을 위한 힙 최적화 힌트 (V8 엔진)
if (process.env.NODE_ENV === 'production') {
  try {
    // GC 접근 가능 여부 확인
    const hasGcAccess = typeof global.gc === 'function';
    if (hasGcAccess && global.gc) {
      global.gc();
      console.log('GC 호출 가능 상태 확인됨, 초기 GC 실행 완료');
    } else {
      console.log(
        'GC hook을 사용할 수 없습니다. node --expose-gc 플래그를 사용하세요.'
      );
    }
  } catch (e) {
    console.log('GC hook 접근 중 오류 발생:', e);
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

    // 서버 시작 시간 기록
    const startTime = Date.now();

    // Render 환경에서는 keepAlive 인터벌 최적화
    let keepAliveInterval: NodeJS.Timeout | null = null;
    
    // 메모리 누수 방지를 위한 추가 설정
    // Render 환경에서는 활성 연결 유지를 위한 인터벌 최적화 (5분)
    if (isRenderEnv) {
      const KEEPALIVE_INTERVAL = 300000; // 5분

      keepAliveInterval = setInterval(async () => {
        const uptime = Math.round((Date.now() - startTime) / 1000);
        console.log(
          `[${new Date().toISOString()}] 서버 활성 상태 유지 핑 (실행 시간: ${uptime}초)`
        );

        // 힙 메모리 상태 로깅
        const memoryUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
        const rss = Math.round(memoryUsage.rss / 1024 / 1024);

        console.log(
          `메모리 상태: RSS=${rss}MB, Heap=${heapUsedMB}/${heapTotalMB}MB`
        );

        // 메모리 사용량이 높을 때 GC 실행 힌트
        if (heapUsedMB > heapTotalMB * 0.5) {
          // 임계값을 70%에서 50%로 낮춤
          console.log('높은 메모리 사용량 감지, GC 힌트 시도...');
          try {
            if (typeof global.gc === 'function') {
              global.gc();
              console.log('GC 힌트 실행 완료');
            }
          } catch (e) {
            console.log('GC hook 접근 중 오류 발생:', e);
          }
        }

        // 간헐적 DB 연결 확인 - 불필요한 중복 확인 방지
        if (uptime % 600 === 0) { // 10분마다
          try {
            await prisma.$queryRaw`SELECT 1`;
            console.log(
              `[${new Date().toISOString()}] 서버 keepAlive DB 연결 확인 성공`
            );
          } catch (err) {
            console.error(
              `[${new Date().toISOString()}] 서버 keepAlive DB 연결 확인 실패:`,
              err
            );
          }
        }
      }, KEEPALIVE_INTERVAL);

      console.log(`Render 환경용 keepAlive 인터벌 설정됨: ${KEEPALIVE_INTERVAL / 60000}분 간격`);
    } else {
      // 비 Render 환경에서의 인터벌 (2분)
      keepAliveInterval = setInterval(async () => {
        const uptime = Math.round((Date.now() - startTime) / 1000);
        console.log(
          `[${new Date().toISOString()}] 서버 활성 상태 유지 핑 (실행 시간: ${uptime}초)`
        );

        // 명시적 GC 호출
        if (typeof global.gc === 'function') {
          global.gc();
        }
      }, 120000);
    }

    // 프로세스 종료 시 인터벌 정리
    const cleanupResources = () => {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
        console.log('keepAlive 인터벌 정리 완료');
      }
    };

    process.on('SIGTERM', cleanupResources);
    process.on('SIGINT', cleanupResources);

  } catch (e) {
    console.error('최상위 레벨에서 서버 시작 오류 발생:', e);
  }
})();
