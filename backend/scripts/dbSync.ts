/// <reference types="node" />

// Windows와 Unix 환경 모두에서 작동하는 데이터베이스 동기화 스크립트
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

// 명령줄 인수 파싱
const args: string[] = process.argv.slice(2);
let forceMigrate: boolean = false;
let seed: boolean = false;

// 명령줄 인수 처리
args.forEach((arg: string) => {
  if (arg === '--forceMigrate=true') {
    forceMigrate = true;
  } else if (arg === '--seed=true') {
    seed = true;
  }
});

console.log(
  `데이터베이스 동기화 시작 (forceMigrate=${forceMigrate}, seed=${seed})`
);

// 현재 실행 플랫폼 확인
const isWindows: boolean = process.platform === 'win32';

// TypeScript 실행 명령 (Windows의 경우 .cmd 확장자 필요)
const tsNodeCmd: string = isWindows ? 'ts-node.cmd' : 'ts-node';

// dbSync 모듈 경로 (OS에 맞게 경로 구분자 처리)
const dbSyncPath: string = './src/utils/dbSync';

// 명령 실행
let syncProcess: ChildProcess;

try {
  // 플랫폼에 따라 다른 방식으로 명령 실행
  if (isWindows) {
    // Windows에서는 명령줄 문자열로 실행
    const command: string = `${tsNodeCmd} -e "import { syncDatabase } from '${dbSyncPath}'; syncDatabase({ forceMigrate: ${forceMigrate}, seed: ${seed} });"`;

    syncProcess = spawn(command, [], {
      stdio: 'inherit',
      shell: true,
    });
  } else {
    // Unix에서는 배열 인자로 실행
    syncProcess = spawn(
      tsNodeCmd,
      [
        '-e',
        `import { syncDatabase } from '${dbSyncPath}'; syncDatabase({ forceMigrate: ${forceMigrate}, seed: ${seed} });`,
      ],
      {
        stdio: 'inherit',
        shell: true,
      }
    );
  }

  syncProcess.on('error', (err: Error) => {
    console.error('프로세스 실행 중 오류 발생:', err);
    process.exit(1);
  });

  syncProcess.on('close', (code: number | null) => {
    console.log(
      `데이터베이스 동기화 ${code === 0 ? '성공' : '실패'} (종료 코드: ${code})`
    );
    process.exit(code || 1);
  });
} catch (error) {
  console.error('데이터베이스 동기화 실행 오류:', error);
  process.exit(1);
}
