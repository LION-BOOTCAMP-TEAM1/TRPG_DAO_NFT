#!/usr/bin/env node

/**
 * 이 스크립트는 Node.js 서버 프로세스가 백그라운드에서 
 * 계속 실행되도록 보장하는 유틸리티입니다.
 * 
 * Render.com과 같은 환경에서 노드 프로세스가 종료되는 것을 방지합니다.
 */

// 프로세스가 종료되지 않도록 stdin을 열어둠
process.stdin.resume();

// 이벤트 루프에 항상 작업이 있도록 인터벌 설정
const keepAliveInterval = setInterval(() => {
  console.log(`[KEEP-ALIVE] 서버 활성 유지 중: ${new Date().toISOString()}`);
  
  // 메모리 사용량 모니터링
  const memoryUsage = process.memoryUsage();
  console.log(`[KEEP-ALIVE] 메모리 사용량: RSS ${Math.round(memoryUsage.rss / 1024 / 1024)}MB, 힙 ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`);
}, 30000);

// 종료 시그널을 전달 받아도 계속 실행
process.on('SIGTERM', () => {
  console.log('[KEEP-ALIVE] SIGTERM 신호를 받았지만 계속 실행합니다.');
});

process.on('SIGINT', () => {
  console.log('[KEEP-ALIVE] SIGINT 신호를 받았지만 계속 실행합니다.');
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

// 종료 직전 이벤트에 응답하여 종료 방지
process.on('beforeExit', () => {
  console.log('[KEEP-ALIVE] 프로세스 종료 시도가 감지되었지만 종료를 방지합니다.');
  // 새로운 비동기 작업 생성하여 이벤트 루프 유지
  setImmediate(() => {
    console.log('[KEEP-ALIVE] 프로세스 유지 중...');
  });
});

// 기본 메시지 출력
console.log('[KEEP-ALIVE] 서버 유지 모듈이 시작되었습니다.');
console.log('[KEEP-ALIVE] 서버 프로세스가 계속 실행되도록 유지합니다.'); 