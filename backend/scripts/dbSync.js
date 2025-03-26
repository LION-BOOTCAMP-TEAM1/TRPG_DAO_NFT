// Windows와 Unix 환경 모두에서 작동하는 데이터베이스 동기화 스크립트
const { spawn } = require('child_process');
const path = require('path');

// 명령줄 인수 파싱
const args = process.argv.slice(2);
let forceMigrate = false;
let seed = false;

// 명령줄 인수 처리
args.forEach(arg => {
  if (arg === '--forceMigrate=true') {
    forceMigrate = true;
  } else if (arg === '--seed=true') {
    seed = true;
  }
});

console.log(`데이터베이스 동기화 시작 (forceMigrate=${forceMigrate}, seed=${seed})`);

// 현재 실행 플랫폼 확인
const isWindows = process.platform === 'win32';

// TypeScript 실행 명령 (Windows의 경우 .cmd 확장자 필요)
const tsNodeCmd = isWindows ? 'ts-node.cmd' : 'ts-node';

// dbSync 모듈 경로 (OS에 맞게 경로 구분자 처리)
const dbSyncPath = './src/utils/dbSync';

// 명령 실행
let syncProcess;

try {
  // 플랫폼에 따라 다른 방식으로 명령 실행
  if (isWindows) {
    // Windows에서는 명령줄 문자열로 실행
    const command = `${tsNodeCmd} -e "import { syncDatabase } from '${dbSyncPath}'; syncDatabase({ forceMigrate: ${forceMigrate}, seed: ${seed} });"`;
    
    syncProcess = spawn(command, [], {
      stdio: 'inherit',
      shell: true
    });
  } else {
    // Unix에서는 배열 인자로 실행
    syncProcess = spawn(tsNodeCmd, [
      '-e',
      `import { syncDatabase } from '${dbSyncPath}'; syncDatabase({ forceMigrate: ${forceMigrate}, seed: ${seed} });`
    ], {
      stdio: 'inherit',
      shell: true
    });
  }

  syncProcess.on('error', (err) => {
    console.error('프로세스 실행 중 오류 발생:', err);
    process.exit(1);
  });

  syncProcess.on('close', (code) => {
    console.log(`데이터베이스 동기화 ${code === 0 ? '성공' : '실패'} (종료 코드: ${code})`);
    process.exit(code);
  });
} catch (error) {
  console.error('데이터베이스 동기화 실행 오류:', error);
  process.exit(1);
} 