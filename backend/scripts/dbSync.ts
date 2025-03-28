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

// 대신 실행파일로 만듭니다
const syncFile = path.join(__dirname, 'runSync.ts');

// 명령 실행
let syncProcess: ChildProcess;

try {
  syncProcess = spawn(
    isWindows ? 'ts-node.cmd' : 'ts-node',
    [syncFile, forceMigrate ? '--forceMigrate=true' : '--forceMigrate=false', seed ? '--seed=true' : '--seed=false'],
    {
      stdio: 'inherit',
      shell: true,
    }
  );

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
