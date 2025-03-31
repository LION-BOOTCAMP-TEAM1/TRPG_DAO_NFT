#!/usr/bin/env node

/**
 * 이 스크립트는 서버 프로세스를 관리하고 오류가 발생해도 재시작합니다.
 * Render.com과 같은 환경에서 Node.js 서버의 안정성을 높입니다.
 */

const { spawn } = require('child_process');
const path = require('path');

// 서버 프로세스 실행 명령어
const SERVER_COMMAND = 'node';
const SERVER_ARGS = [path.join(__dirname, '../dist/src/server.js')];

// 환경 변수 설정
const ENV = {
  ...process.env,
  NODE_ENV: 'production',
  SKIP_DB_SYNC: 'true',
  NODE_OPTIONS: '--max-old-space-size=2048',
  // Render 환경 플래그 확실히 설정
  IS_RENDER: 'true',
  RENDER: 'true'
};

console.log('====== 서버 프로세스 매니저 시작 ======');
console.log(`시작 시간: ${new Date().toISOString()}`);
console.log(`실행 명령어: ${SERVER_COMMAND} ${SERVER_ARGS.join(' ')}`);
console.log('======================================');

// 시작 횟수 트래킹
let startCount = 0;
const MAX_RESTARTS = 20; // 최대 재시작 횟수

// 서버 시작 함수
function startServer() {
  startCount++;
  console.log(`[${new Date().toISOString()}] 서버 프로세스 시작 중... (시도 ${startCount}/${MAX_RESTARTS})`);
  
  // 최대 재시작 횟수 초과 시 지연 증가
  if (startCount > MAX_RESTARTS) {
    console.log(`[${new Date().toISOString()}] 최대 재시작 횟수 초과. 60초 후 다시 시도합니다.`);
    startCount = 0; // 카운터 리셋
    setTimeout(startServer, 60000); // 1분 후 재시도
    return;
  }
  
  // 서버 프로세스 시작
  const serverProcess = spawn(SERVER_COMMAND, SERVER_ARGS, {
    env: ENV,
    stdio: 'inherit' // 자식 프로세스의 stdio를 부모와 공유
  });
  
  // 프로세스 ID 로깅
  console.log(`[${new Date().toISOString()}] 서버 프로세스 시작됨 (PID: ${serverProcess.pid})`);
  
  // 프로세스 종료 이벤트 처리
  serverProcess.on('close', (code) => {
    console.log(`[${new Date().toISOString()}] 서버 프로세스가 종료됨 (코드: ${code}, 타입: ${typeof code})`);
    
    // 비정상 종료인 경우 재시작 (code === null은 외부에서 강제 종료된 경우)
    if (code !== 0) {
      console.log(`[${new Date().toISOString()}] 비정상 종료 감지됨 (코드: ${code}), 프로세스 정보:`, 
        JSON.stringify(process.memoryUsage()));
      console.log(`[${new Date().toISOString()}] 5초 후 재시작...`);
      setTimeout(startServer, 5000);
    } else {
      console.log(`[${new Date().toISOString()}] 정상 종료 감지됨, 프로세스 매니저도 종료`);
      process.exit(0);
    }
  });
  
  // 오류 이벤트 처리
  serverProcess.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] 서버 프로세스 오류 발생:`, error);
    console.log(`[${new Date().toISOString()}] 5초 후 재시작...`);
    setTimeout(startServer, 5000);
  });
  
  return serverProcess;
}

// 프로세스 매니저 자체의 종료 시그널 처리
process.on('SIGTERM', () => {
  console.log(`[${new Date().toISOString()}] 프로세스 매니저가 SIGTERM 신호를 받음`);
  console.log('프로세스 매니저는 계속 실행됩니다.');
});

process.on('SIGINT', () => {
  console.log(`[${new Date().toISOString()}] 프로세스 매니저가 SIGINT 신호를 받음`);
  console.log('프로세스 매니저는 계속 실행됩니다.');
});

// 예상치 못한 예외가 발생해도 프로세스 매니저는 계속 실행
process.on('uncaughtException', (error) => {
  console.error(`[${new Date().toISOString()}] 프로세스 매니저에서 처리되지 않은 예외 발생:`, error);
  console.log('프로세스 매니저는 계속 실행됩니다.');
});

process.on('unhandledRejection', (reason) => {
  console.error(`[${new Date().toISOString()}] 프로세스 매니저에서 처리되지 않은 Promise 거부:`, reason);
  console.log('프로세스 매니저는 계속 실행됩니다.');
});

// 프로세스 관리자가 종료되지 않도록 설정
process.stdin.resume();

// 마지막 재시작 시간 기록
let lastRestartTime = Date.now();

// 서버 프로세스 시작
startServer();

// 정기적으로 상태 로깅
setInterval(() => {
  const uptimeSeconds = Math.round((Date.now() - lastRestartTime) / 1000);
  console.log(`[${new Date().toISOString()}] 프로세스 매니저 상태: 활성화 / 실행 시간: ${uptimeSeconds}초`);
  console.log(`[${new Date().toISOString()}] 메모리 사용량:`, JSON.stringify(process.memoryUsage()));
  
  // Render 환경 변수 로깅
  console.log(`[${new Date().toISOString()}] Render 환경 변수: IS_RENDER=${ENV.IS_RENDER}, RENDER=${ENV.RENDER}`);
}, 30000); // 30초마다 로깅 