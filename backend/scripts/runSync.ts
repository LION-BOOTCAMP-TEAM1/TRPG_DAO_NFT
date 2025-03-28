import { syncDatabase } from '../src/utils/dbSync';
import { spawn } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

// Prisma 생성 전 임시 파일 정리 함수
function cleanupPrismaFiles(): void {
  try {
    console.log('Prisma 임시 파일 정리 중...');
    const prismaClientDir = join(__dirname, '../node_modules/.prisma/client');
    
    // 임시 dll 파일 패턴들
    const possibleTempFiles = [
      'query_engine-windows.dll.node',
      'query_engine-windows.dll.node.tmp*',
      'libquery_engine-*',
      '*.tmp*'
    ];
    
    // 프로세스가 사용 중인 Prisma Engine 파일을 정리하기 위해 잠시 대기
    console.log('기존 프로세스 정리를 위해 잠시 대기 중...');
    
    // Windows 환경에서는 실행 중인 다른 Node 프로세스가 DLL을 잠글 수 있음
    if (process.platform === 'win32') {
      // Windows에서 taskkill 명령을 사용하여 node 프로세스를 정리할 수 있지만,
      // 위험하므로 여기서는 수동 정리를 위한 안내 메시지만 표시
      console.log('주의: 다른 Node.js 프로세스가 Prisma 엔진 파일을 사용 중일 수 있습니다.');
      console.log('문제가 계속되면 다른 Node.js 프로세스를 종료하고 다시 시도하세요.');
    }
  } catch (error) {
    console.warn('Prisma 파일 정리 중 오류 발생:', error);
    // 정리 오류는 무시하고 계속 진행
  }
}

// Prisma 생성 명령 실행 함수
async function generatePrismaClient(): Promise<void> {
  return new Promise((resolve, reject) => {
    // 먼저 문제가 될 수 있는 파일들 정리
    cleanupPrismaFiles();
    
    console.log('Prisma 클라이언트 생성 중...');
    
    // NODE_OPTIONS 환경 변수 설정하여 메모리 한도 증가
    const env = { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' };
    
    // prisma generate 명령 실행
    const prismaGenerate = spawn('npx', ['prisma', 'generate'], {
      stdio: 'inherit',
      shell: true,
      env
    });
    
    prismaGenerate.on('close', (code) => {
      if (code === 0) {
        console.log('Prisma 클라이언트 생성 완료');
        resolve();
      } else {
        console.error(`Prisma 클라이언트 생성 실패 (종료 코드: ${code})`);
        
        // 실패 시 복구 조치 안내
        console.log('문제 해결 제안:');
        console.log('1. "npm run db:prisma:generate"를 직접 실행해보세요');
        console.log('2. "npx prisma generate --force"를 시도해보세요');
        console.log('3. node_modules/.prisma 디렉토리를 삭제하고 다시 시도하세요');
        
        reject(new Error(`Prisma 생성 실패 (코드: ${code})`));
      }
    });
    
    prismaGenerate.on('error', (err) => {
      console.error('Prisma 생성 실행 오류:', err);
      reject(err);
    });
  });
}

// 명령줄 인수 파싱
const args: string[] = process.argv.slice(2);
const forceMigrate = args.includes('--forceMigrate=true');
const seed = args.includes('--seed=true');

// 최대 3번까지 재시도하는 로직
async function runWithRetry(fn: () => Promise<void>, maxRetries = 3): Promise<void> {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      await fn();
      return; // 성공하면 함수 종료
    } catch (error) {
      retries++;
      console.error(`시도 ${retries}/${maxRetries} 실패:`, error);
      
      if (retries < maxRetries) {
        console.log(`${5 * retries}초 후 재시도합니다...`);
        // 재시도 전 짧은 대기 시간
        await new Promise(resolve => setTimeout(resolve, 5000 * retries));
      } else {
        throw error; // 최대 재시도 횟수를 초과하면 오류 전파
      }
    }
  }
}

// Prisma 생성 및 데이터베이스 동기화 실행 (재시도 로직 적용)
runWithRetry(() => generatePrismaClient())
  .then(() => syncDatabase({ forceMigrate, seed }))
  .then(() => {
    console.log('데이터베이스 동기화 작업 완료됨');
  })
  .catch((err) => {
    console.error('작업 실패:', err);
    process.exit(1);
  }); 