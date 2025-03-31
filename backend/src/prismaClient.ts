import { PrismaClient, Prisma } from '@prisma/client';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

// Prisma 클라이언트 옵션 설정
const prismaOptions: Prisma.PrismaClientOptions = {
  log: process.env.NODE_ENV === 'production' 
    ? ['error' as Prisma.LogLevel] 
    : ['query', 'error', 'warn'] as Prisma.LogLevel[],
  
  // 연결 설정
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    },
  }
};

// 연결 타임아웃 설정 (5분)
const connectionTimeoutMs = 300000; // 5분

// Prisma 클라이언트 인스턴스 생성
const prisma = new PrismaClient(prismaOptions);

// 연결 재시도 로직
let isConnected = false;
let retryCount = 0;
const MAX_RETRIES = 5;

async function connectWithRetry() {
  try {
    if (!isConnected) {
      // 연결 테스트
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      console.log('프리즈마 DB 연결 성공!');
      isConnected = true;
      retryCount = 0; // 재시도 카운터 초기화
    }
  } catch (e) {
    retryCount++;
    console.error(`DB 연결 실패 (시도 ${retryCount}/${MAX_RETRIES}):`, e);
    
    if (retryCount < MAX_RETRIES) {
      // 지수 백오프 알고리즘 적용 (1초, 2초, 4초, 8초...)
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount - 1), 30000);
      console.log(`${retryDelay / 1000}초 후 재시도...`);
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return connectWithRetry(); // 재귀적으로 재시도
    } else {
      console.error('최대 재시도 횟수 초과. DB 연결 실패.');
      // 여기서 프로세스를 종료하거나 다른 오류 처리를 할 수 있음
      throw e;
    }
  }
}

// 서버 시작 시 최초 연결 시도
if (process.env.NODE_ENV === 'production') {
  // 프로덕션 환경에서만 자동 연결 시도
  connectWithRetry()
    .catch(e => {
      console.error('초기 DB 연결 실패:', e);
    });
}

// 미들웨어: 각 요청마다 연결 확인
prisma.$use(async (params, next) => {
  if (!isConnected && process.env.NODE_ENV === 'production') {
    await connectWithRetry();
  }
  return next(params);
});

export default prisma;
