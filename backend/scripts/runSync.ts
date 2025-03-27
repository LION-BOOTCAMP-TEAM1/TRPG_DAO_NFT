import { syncDatabase } from '../src/utils/dbSync';
import { spawn } from 'child_process';

// Prisma 생성 명령 실행 함수
async function generatePrismaClient(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Prisma 클라이언트 생성 중...');
    
    const prismaGenerate = spawn('npx', ['prisma', 'generate'], {
      stdio: 'inherit',
      shell: true
    });
    
    prismaGenerate.on('close', (code) => {
      if (code === 0) {
        console.log('Prisma 클라이언트 생성 완료');
        resolve();
      } else {
        console.error(`Prisma 클라이언트 생성 실패 (종료 코드: ${code})`);
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

// 먼저 Prisma 생성 실행 후 데이터베이스 동기화
generatePrismaClient()
  .then(() => syncDatabase({ forceMigrate, seed }))
  .then(() => {
    console.log('데이터베이스 동기화 작업 완료됨');
  })
  .catch((err) => {
    console.error('작업 실패:', err);
    process.exit(1);
  }); 