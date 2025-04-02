#!/usr/bin/env node

/**
 * 이 스크립트는 Node.js 서버 프로세스가 백그라운드에서 
 * 계속 실행되도록 보장하는 유틸리티입니다.
 * 
 * Render.com과 같은 환경에서 노드 프로세스가 종료되는 것을 방지합니다.
 * 
 * 메모리 누수 방지를 위해 최적화되었습니다.
 */

// 프로세스가 종료되지 않도록 stdin을 열어둠
process.stdin.resume();

// 시작 시간 기록
const startTime = Date.now();

// GC 접근 가능 여부 확인
const hasGcAccess = typeof global.gc === 'function';
if (!hasGcAccess) {
  console.warn('[KEEP-ALIVE] ⚠️ 경고: --expose-gc 플래그가 감지되지 않았습니다.');
  console.warn('[KEEP-ALIVE]      스크립트는 GC 기능 없이 계속 실행됩니다.');
}

// 메모리 사용량 모니터링 기록
let lastMemoryUsage = process.memoryUsage();
let lastMemoryCheckTime = Date.now();

// 이벤트 루프에 항상 작업이 있도록 인터벌 설정 - 5분으로 변경하여 메모리 부담 감소
const keepAliveInterval = setInterval(() => {
  const now = Date.now();
  const uptime = Math.round((now - startTime) / 1000);
  
  // 로그 출력은 10분마다 한 번씩 (메모리 부담 최소화)
  if (uptime % 600 === 0) {
    console.log(`[KEEP-ALIVE] 서버 활성 유지 중: ${new Date().toISOString()}, 실행 시간: ${uptime}초`);
  }
  
  // 메모리 사용량 모니터링 - 10분마다 출력하여 로그 크기 제한
  if (now - lastMemoryCheckTime > 600000) { // 10분
    const memoryUsage = process.memoryUsage();
    const diffHeapUsed = Math.round((memoryUsage.heapUsed - lastMemoryUsage.heapUsed) / 1024 / 1024);
    
    console.log(`[KEEP-ALIVE] 메모리 사용량: RSS ${Math.round(memoryUsage.rss / 1024 / 1024)}MB, 힙 ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`);
    console.log(`[KEEP-ALIVE] 메모리 변화(10분): ${diffHeapUsed > 0 ? '+' : ''}${diffHeapUsed}MB`);
    
    // 메모리 누수 가능성 감지
    if (diffHeapUsed > 50) { // 10분 내 50MB 이상 증가하면 경고
      console.warn(`[KEEP-ALIVE] 경고: 메모리 사용량이 빠르게 증가하고 있습니다. 메모리 누수 가능성이 있습니다.`);
      
      // GC 힌트 시도
      try {
        if (hasGcAccess && global.gc) {
          global.gc();
          console.log('[KEEP-ALIVE] GC 힌트 실행 완료');
        }
      } catch (e) {
        console.log('[KEEP-ALIVE] GC 실행 중 오류:', e);
      }
    }
    
    lastMemoryUsage = memoryUsage;
    lastMemoryCheckTime = now;
  }
}, 300000); // 5분 간격

// 종료 시그널을 전달 받아도 계속 실행 - 메모리 정리 로직 추가
process.on('SIGTERM', () => {
  console.log('[KEEP-ALIVE] SIGTERM 신호를 받았지만 계속 실행합니다.');
  // 메모리 정리 시도
  try {
    if (hasGcAccess && global.gc) global.gc();
  } catch (e) {
    console.error('[KEEP-ALIVE] GC 실행 중 오류:', e);
  }
});

process.on('SIGINT', () => {
  console.log('[KEEP-ALIVE] SIGINT 신호를 받았지만 계속 실행합니다.');
  // 메모리 정리 시도
  try {
    if (hasGcAccess && global.gc) global.gc();
  } catch (e) {
    console.error('[KEEP-ALIVE] GC 실행 중 오류:', e);
  }
});

// 예상치 못한 예외가 발생해도 계속 실행
process.on('uncaughtException', (error) => {
  console.error('[KEEP-ALIVE] 처리되지 않은 예외 발생:', error);
  console.error('[KEEP-ALIVE] 서버는 계속 실행됩니다.');
});

process.on('unhandledRejection', (reason) => {
  console.error('[KEEP-ALIVE] 처리되지 않은 Promise 거부:', reason);
  console.error('[KEEP-ALIVE] 서버는 계속 실행됩니다.');
});

// 기본 메시지 출력
console.log('[KEEP-ALIVE] 서버 유지 모듈이 시작되었습니다.');
console.log('[KEEP-ALIVE] 최적화된 상태로 서버 프로세스가 계속 실행되도록 유지합니다.'); 