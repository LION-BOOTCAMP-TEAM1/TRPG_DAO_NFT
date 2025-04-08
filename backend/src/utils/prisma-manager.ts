/**
 * Prisma 클라이언트 최적화 관리자
 * 
 * 이 파일은 Prisma 클라이언트의 연결을 효율적으로 관리하고
 * 메모리 누수를 방지하기 위한 유틸리티를 제공합니다.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { logMemoryUsage } from './memory-utils';

// 환경 변수 설정
const MAX_CONNECTIONS = parseInt(process.env.DB_POOL_SIZE || '2'); // 기본값 2로 낮춤
const CONNECTION_TIMEOUT = parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000');
const IDLE_TIMEOUT = parseInt(process.env.DB_IDLE_TIMEOUT || '60000');
const IS_NEON_SERVERLESS = process.env.NEON_SERVERLESS === 'true';
const MEMORY_DIAGNOSTICS = process.env.MEMORY_DIAGNOSTICS === 'true';
const isProduction = process.env.NODE_ENV === 'production' || process.env.IS_RENDER === 'true' || process.env.RENDER === 'true';

// 글로벌 스코프로 싱글톤 구현 (핫 리로딩 환경에서도 작동하도록)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 유저가 명시적으로 설정한 연결 URL 우선 사용 (있을 경우)
let connectionUrl = isProduction 
  ? process.env.DATABASE_URL 
  : process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

// 연결 문자열에 connection_limit 및 풀 타임아웃 설정 추가
if (connectionUrl) {
  const hasQueryParams = connectionUrl.includes('?');
  connectionUrl = connectionUrl + (hasQueryParams ? '&' : '?') + 
    `connection_limit=${MAX_CONNECTIONS}&pool_timeout=${process.env.NEON_POOL_TIMEOUT || '30'}`;
  
  console.log(`[PrismaManager] 연결 제한 설정: ${MAX_CONNECTIONS}, 타임아웃: ${process.env.NEON_POOL_TIMEOUT || '30'}s`);
}

// Prisma 기본 클라이언트 인스턴스 (싱글톤)
function createPrismaClient() {
  console.log('[PrismaManager] 새 Prisma 인스턴스 생성');
  
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: connectionUrl
      }
    }
  });
  
  // 연결/연결 해제 로깅 추가
  const originalConnect = client.$connect.bind(client);
  client.$connect = async () => {
    console.log('[PrismaManager] DB 연결 시작');
    const result = await originalConnect();
    console.log('[PrismaManager] DB 연결 성공');
    return result;
  };
  
  const originalDisconnect = client.$disconnect.bind(client);
  client.$disconnect = async () => {
    console.log('[PrismaManager] DB 연결 해제 시작');
    const result = await originalDisconnect();
    console.log('[PrismaManager] DB 연결 해제 완료');
    return result;
  };
  
  return client;
}

// 싱글톤 패턴으로 Prisma 인스턴스 관리
export const prisma = globalForPrisma.prisma || createPrismaClient();

// 개발 환경에서 글로벌 객체에 저장 (핫 리로딩 대응)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Neon 서버리스 환경에서 문제 방지를 위한 연결 관리
if (IS_NEON_SERVERLESS) {
  console.log('🔄 Neon 서버리스 최적화 모드 활성화');

  // 애플리케이션 종료 시 연결 정리
  process.on('SIGTERM', async () => {
    console.log('👋 서버 종료 중, Prisma 연결 정리...');
    await prisma.$disconnect();
  });

  process.on('SIGINT', async () => {
    console.log('👋 서버 인터럽트, Prisma 연결 정리...');
    await prisma.$disconnect();
  });

  // 예기치 않은 오류 처리
  process.on('uncaughtException', async (error) => {
    console.error('❌ 처리되지 않은 예외:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
}

// 메모리 사용량 로깅 미들웨어
if (MEMORY_DIAGNOSTICS) {
  prisma.$use(async (params, next) => {
    const before = process.memoryUsage();
    const result = await next(params);
    const after = process.memoryUsage();
    
    // 큰 메모리 사용량 변화가 있을 때만 로깅
    const heapDiff = after.heapUsed - before.heapUsed;
    if (Math.abs(heapDiff) > 5 * 1024 * 1024) { // 5MB 이상 차이
      console.log(`🔍 메모리 변화 감지: ${params.model}.${params.action}`);
      logMemoryUsage();

      // 가비지 컬렉션 요청
      if (typeof global.gc === 'function') {
        global.gc();
      }
    }
    
    return result;
  });
}

// 주기적으로 연결 상태 확인 및 유휴 연결 정리
let connectionCleanupInterval: NodeJS.Timeout | null = null;

export function startConnectionCleanup(intervalMs = 5 * 60 * 1000) { // 기본 5분 간격
  if (connectionCleanupInterval) {
    clearInterval(connectionCleanupInterval);
  }
  
  console.log(`[PrismaManager] 연결 정리 시작 (${intervalMs / 1000}초 간격)`);
  
  connectionCleanupInterval = setInterval(async () => {
    try {
      // 간단한 쿼리로 연결 확인
      await prisma.$queryRaw`SELECT 1 as connection_check`;
      console.log('[PrismaManager] 연결 확인 성공');
      
      // 메모리 상태 로깅
      logMemoryUsage();
      
      // GC 요청
      if (typeof global.gc === 'function') {
        global.gc();
      }
    } catch (error) {
      console.error('[PrismaManager] 연결 확인 실패:', error);
      // 연결 재설정 시도
      try {
        await prisma.$disconnect();
        await prisma.$connect();
      } catch (reconnectError) {
        console.error('[PrismaManager] 재연결 실패:', reconnectError);
      }
    }
  }, intervalMs);
  
  return connectionCleanupInterval;
}

export function stopConnectionCleanup() {
  if (connectionCleanupInterval) {
    clearInterval(connectionCleanupInterval);
    connectionCleanupInterval = null;
    console.log('[PrismaManager] 연결 정리 중지됨');
  }
}

// Prisma 트랜잭션 헬퍼 - 효율적인 트랜잭션 처리
export const withTransaction = async (fn: (tx: any) => Promise<any>) => {
  try {
    const result = await prisma.$transaction(fn);
    return result;
  } catch (error: any) {
    console.error('❌ 트랜잭션 오류:', error.message);
    throw error;
  }
};

// Prisma 연결 테스트 함수
export const testConnection = async () => {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    return result;
  } catch (error: any) {
    console.error('❌ DB 연결 테스트 실패:', error.message);
    throw error;
  }
};

// 서버 시작 시 연결 정리 자동 시작 (프로덕션/렌더 환경)
if (isProduction) {
  startConnectionCleanup();
}

export default prisma; 