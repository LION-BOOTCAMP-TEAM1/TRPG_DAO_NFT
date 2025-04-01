#!/usr/bin/env node

/**
 * Neon DB 연결 모니터링 스크립트
 * 
 * 주기적으로 Neon DB 연결 상태를 모니터링하고 불필요한 연결을 정리합니다.
 * 백그라운드에서 실행하여 서버와 함께 작동하는 것이 좋습니다.
 * 
 * 사용법: node scripts/neon-monitor.js [interval_in_mins]
 * 예: node scripts/neon-monitor.js 15 - 15분 간격으로 모니터링
 */

const { Client } = require('pg');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

// 로그 파일 설정
const LOG_DIR = path.join(__dirname, '../logs');
const LOG_FILE = path.join(LOG_DIR, 'neon-monitor.log');

// 로그 디렉토리가 없으면 생성
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// 로그 작성 함수
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  console.log(logMessage);
  
  // 파일에도 로깅
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

// 설정값 초기화
const INTERVAL_MINS = parseInt(process.argv[2]) || 30; // 기본 30분
const CLEANUP_IDLE_MINS = 10; // 10분 이상 유휴 상태인 연결 정리
const CONNECTION_LIMIT = process.env.DB_POOL_SIZE 
  ? parseInt(process.env.DB_POOL_SIZE) 
  : 5; // 기본 풀 크기

// 시작 메시지
log(`Neon DB 모니터링 시작 (${INTERVAL_MINS}분 간격)`);
log(`설정: 유휴 연결 정리 시간 = ${CLEANUP_IDLE_MINS}분, 연결 제한 = ${CONNECTION_LIMIT}`);

// 환경 정보
const isProduction = process.env.NODE_ENV === 'production';
const isRender = process.env.IS_RENDER === 'true' || process.env.RENDER === 'true';
const connectionString = (isProduction || isRender)
  ? process.env.DATABASE_URL
  : process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  log('오류: DATABASE_URL이 설정되지 않았습니다.');
  process.exit(1);
}

// 메모리 사용량 출력
function printMemoryUsage() {
  const memUsage = process.memoryUsage();
  const formattedMem = {
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
  };
  
  return `메모리: RSS=${formattedMem.rss}, Heap=${formattedMem.heapUsed}/${formattedMem.heapTotal}`;
}

// 주 모니터링 함수
async function monitorDatabase() {
  log(`[모니터링 실행] ${printMemoryUsage()}`);
  
  let client;
  try {
    // 클라이언트 생성
    client = new Client({
      connectionString,
      connectionTimeoutMillis: 10000,
      statement_timeout: 15000,
    });
    
    // 연결
    await client.connect();
    
    // 현재 연결 수 확인
    const connResult = await client.query(`
      SELECT count(*) as count 
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `);
    
    const connCount = parseInt(connResult.rows[0].count);
    log(`현재 연결 수: ${connCount}`);
    
    // 연결 상태 요약
    const stateResult = await client.query(`
      SELECT state, count(*) 
      FROM pg_stat_activity 
      WHERE datname = current_database() 
      GROUP BY state
    `);
    
    log('연결 상태 요약:');
    stateResult.rows.forEach(row => {
      log(`- ${row.state || '상태 없음'}: ${row.count}개`);
    });
    
    // 장기 유휴 연결 확인
    const idleResult = await client.query(`
      SELECT count(*) as count 
      FROM pg_stat_activity 
      WHERE 
        datname = current_database() AND
        state = 'idle' AND
        EXTRACT(EPOCH FROM (now() - state_change)) > ${CLEANUP_IDLE_MINS * 60}
    `);
    
    const idleCount = parseInt(idleResult.rows[0].count);
    log(`${CLEANUP_IDLE_MINS}분 이상 유휴 상태 연결: ${idleCount}개`);
    
    // 연결 수가 제한을 초과하거나 유휴 연결이 많으면 정리
    if (connCount > CONNECTION_LIMIT * 1.5 || idleCount > CONNECTION_LIMIT * 0.75) {
      log('유휴 연결이 많습니다. 정리를 시작합니다...');
      
      // 정상 종료 시도
      await client.query(`
        SELECT pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE 
          datname = current_database() AND
          pid <> pg_backend_pid() AND
          state = 'idle' AND
          EXTRACT(EPOCH FROM (now() - state_change)) > ${CLEANUP_IDLE_MINS * 60}
      `);
      
      // 정리 후 연결 수 확인
      const afterCleanupResult = await client.query(`
        SELECT count(*) as count 
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);
      
      const afterCleanupCount = parseInt(afterCleanupResult.rows[0].count);
      log(`정리 후 연결 수: ${afterCleanupCount}`);
      log(`정리된 연결 수: ${connCount - afterCleanupCount}개`);
    } else {
      log('연결 상태가 양호합니다. 정리가 필요하지 않습니다.');
    }
    
    // 명시적 GC 요청
    if (global.gc) {
      global.gc();
      log('가비지 컬렉션 실행 완료');
    }
    
  } catch (error) {
    log(`모니터링 중 오류 발생: ${error.message}`);
    if (error.stack) {
      log(error.stack);
    }
  } finally {
    if (client) {
      try {
        await client.end();
      } catch (err) {
        log(`클라이언트 종료 중 오류: ${err.message}`);
      }
    }
  }
}

// 주기적 모니터링 설정
const intervalMs = INTERVAL_MINS * 60 * 1000;
log(`${INTERVAL_MINS}분(${intervalMs}ms) 간격으로 모니터링을 실행합니다.`);

// 처음 실행
monitorDatabase();

// 주기적 실행
const intervalId = setInterval(monitorDatabase, intervalMs);

// 종료 처리
process.on('SIGINT', () => {
  log('모니터링 종료 신호를 받았습니다. 정리 중...');
  clearInterval(intervalId);
  log('모니터링이 종료되었습니다.');
  process.exit(0);
});

// 프로세스가 비정상 종료되지 않도록 예외 처리
process.on('uncaughtException', (error) => {
  log(`처리되지 않은 예외: ${error.message}`);
  log(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  log('처리되지 않은 프로미스 거부:');
  log(`사유: ${reason}`);
}); 