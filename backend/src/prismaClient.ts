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

// 연결 타임아웃 설정 (1분으로 줄임)
const connectionTimeoutMs = 60000; // 1분

console.log('환경 정보:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`DATABASE_URL 설정됨: ${!!process.env.DATABASE_URL}`);
if (process.env.DATABASE_URL) {
  // 보안을 위해 전체 URL은 출력하지 않고 일부만 로깅
  console.log(`DATABASE_URL 시작 부분: ${process.env.DATABASE_URL.substring(0, 20)}...`);
}

// 글로벌 변수에 Prisma 클라이언트가 이미 있는지 확인하여 핫 리로딩 시 연결이 중복되지 않도록 함
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// 연결 재시도 로직
let isConnected = false;
let retryCount = 0;
const MAX_RETRIES = 5;

async function connectWithRetry() {
  if (isConnected) return; // 이미 연결되어 있으면 아무것도 하지 않음
  
  try {
    // 연결 테스트
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('프리즈마 DB 연결 성공!');
    isConnected = true;
    retryCount = 0; // 재시도 카운터 초기화
  } catch (e) {
    retryCount++;
    console.error(`DB 연결 실패 (시도 ${retryCount}/${MAX_RETRIES}):`, e);
    
    if (retryCount < MAX_RETRIES) {
      // 지수 백오프 알고리즘 적용 (1초, 2초, 4초, 8초...)
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
      console.log(`${retryDelay / 1000}초 후 재시도...`);
      
      return new Promise(resolve => {
        setTimeout(async () => {
          await connectWithRetry();
          resolve(undefined);
        }, retryDelay);
      });
    } else {
      console.error('최대 재시도 횟수 초과. DB 연결 실패.');
      // 프로덕션 환경에서는 프로세스를 종료하지 않고 계속 진행
      if (process.env.NODE_ENV === 'production') {
        console.log('프로덕션 환경에서는 DB 연결 없이 계속 실행합니다.');
        // 에러를 throw하지 않고 계속 진행
        return;
      }
      throw e;
    }
  }
}

// 서버 시작 시 최초 연결 시도
connectWithRetry()
  .catch(e => {
    console.error('초기 DB 연결 실패:', e);
    // 프로덕션 환경에서는 연결 실패해도 계속 진행
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  });

// 미들웨어: 각 요청마다 연결 확인 (최적화)
prisma.$use(async (params, next) => {
  if (!isConnected) {
    try {
      await connectWithRetry();
    } catch (e) {
      console.error('DB 연결 재시도 실패:', e);
      // 프로덕션에서는 에러 발생해도 요청은 처리 시도
    }
  }
  return next(params);
});

export default prisma;
