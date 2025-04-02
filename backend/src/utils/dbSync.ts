import { exec } from 'child_process';
import { promisify } from 'util';
import { prisma } from './prisma-manager'; // prisma-manager에서 인스턴스 가져오기
import * as fs from 'fs';
import * as path from 'path';

const execPromise = promisify(exec);

// 타임아웃 설정 (60초)
const COMMAND_TIMEOUT = 60000;

/**
 * 데이터베이스 동기화 유틸리티 
 * - 스키마 변경 감지 및 마이그레이션 자동 적용
 * - 개발 및 프로덕션 환경에서 사용 가능
 */
export async function syncDatabase(options: {
  forceMigrate?: boolean;
  seed?: boolean;
  autoApprove?: boolean;
} = {}) {
  const { forceMigrate = false, seed = false, autoApprove = false } = options;

  // SKIP_DB_SYNC 환경 변수가 true면 모든 DB 작업 건너뛰기
  if (process.env.SKIP_DB_SYNC === 'true') {
    console.log('SKIP_DB_SYNC=true 설정으로 인해 데이터베이스 동기화를 건너뜁니다.');
    return;
  }

  try {
    console.log('데이터베이스 연결 확인 중...');
    
    // 데이터베이스 연결 테스트 - 공유 인스턴스 사용
    await prisma.$queryRaw`SELECT 1`;
    console.log('데이터베이스 연결 성공!');

    // 스키마 확인
    const isPrismaSchemaChanged = await checkSchemaChanges();
    
    if (isPrismaSchemaChanged || forceMigrate) {
      console.log('스키마 변경이 감지되었거나 강제 마이그레이션이 요청되었습니다.');
      
      if (autoApprove || await confirmAction('마이그레이션을 진행하시겠습니까? (y/n)')) {
        await runMigration();
      } else {
        console.log('마이그레이션이 사용자에 의해 취소되었습니다.');
      }
    } else {
      console.log('스키마 변경이 감지되지 않았습니다. 마이그레이션을 건너뜁니다.');
    }

    // 시드 데이터 적용
    if (seed) {
      if (autoApprove || await confirmAction('시드 데이터를 적용하시겠습니까? (y/n)')) {
        await runSeed();
      } else {
        console.log('시드 적용이 사용자에 의해 취소되었습니다.');
      }
    }

    console.log('데이터베이스 동기화가 완료되었습니다!');
  } catch (error) {
    console.error('데이터베이스 동기화 중 오류가 발생했습니다:', error);
    // 프로덕션 환경에서는 오류가 발생해도 계속 진행
    if (process.env.NODE_ENV === 'production') {
      console.log('프로덕션 환경에서는 데이터베이스 동기화 오류가 발생해도 서버를 계속 실행합니다.');
    } else {
      throw error;
    }
  }
  // 공유 인스턴스를 사용하므로 $disconnect() 호출을 제거
}

/**
 * Prisma 스키마 변경 여부 확인
 */
async function checkSchemaChanges(): Promise<boolean> {
  try {
    // Render 환경에서는 스키마 변경 확인을 건너뛰고 항상 마이그레이션 실행
    if (process.env.IS_RENDER === 'true') {
      console.log('Render 환경에서는 스키마 변경 확인을 건너뜁니다');
      return true;
    }
    
    const { stdout } = await execWithTimeout(
      'npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma --exit-code',
      COMMAND_TIMEOUT
    );
    return false; // 변경 없음
  } catch (error: any) {
    if (error.code === 'TIMEOUT') {
      console.warn('스키마 변경 확인 타임아웃. 프로덕션 환경에서는 마이그레이션을 진행합니다.');
      return process.env.NODE_ENV === 'production';
    }
    
    if (error.code === 1 || error.code === 2) {
      // 코드 1은 경미한 변경, 코드 2는 테이블 삭제 등 주요 변경 감지됨
      console.log('스키마 변경 감지됨:', error.stdout);
      return true; // 변경 감지됨
    }
    
    if (process.env.NODE_ENV === 'production') {
      console.warn('스키마 확인 중 오류가 발생했지만 프로덕션 환경에서는 계속 진행합니다:', error);
      return false;
    }
    
    throw error; // 다른 오류
  }
}

/**
 * Prisma 마이그레이션 실행
 */
async function runMigration() {
  console.log('마이그레이션 실행 중...');
  
  // 환경에 따라 다른 마이그레이션 명령어 실행
  const isProduction = process.env.NODE_ENV === 'production';
  
  try {
    if (isProduction) {
      // 프로덕션 환경에서는 deploy만 실행
      await execWithTimeout('npx prisma migrate deploy', COMMAND_TIMEOUT);
      console.log('프로덕션 마이그레이션이 성공적으로 적용되었습니다.');
    } else {
      // 개발 환경에서는 스키마 변경사항을 반영하는 마이그레이션 생성
      const migrationName = `schema_update_${new Date().toISOString().replace(/[:.]/g, '_')}`;
      await execWithTimeout(`npx prisma migrate dev --name ${migrationName}`, COMMAND_TIMEOUT);
      console.log('개발 마이그레이션이 성공적으로 생성 및 적용되었습니다.');
    }
  } catch (error: any) {
    if (error.code === 'TIMEOUT') {
      console.error('마이그레이션 명령이 타임아웃됐습니다.');
      if (isProduction) {
        console.log('프로덕션 환경에서는 마이그레이션 실패 후에도 계속 진행합니다.');
        return;
      }
    }
    throw error;
  }
}

/**
 * 시드 데이터 적용
 */
export async function runSeed() {
  console.log('시드 데이터 적용 중...');
  try {
    await execWithTimeout('npm run seed', COMMAND_TIMEOUT);
    console.log('시드 데이터가 성공적으로 적용되었습니다.');
  } catch (error: any) {
    if (error.code === 'TIMEOUT') {
      console.error('시드 명령이 타임아웃됐습니다.');
      if (process.env.NODE_ENV === 'production') {
        console.log('프로덕션 환경에서는 시드 실패 후에도 계속 진행합니다.');
        return;
      }
    }
    throw error;
  }
}

/**
 * 타임아웃 처리가 포함된 exec 함수
 */
async function execWithTimeout(command: string, timeout: number): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const childProcess = exec(command, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });

    // 타임아웃 설정
    const timer = setTimeout(() => {
      if (childProcess.pid) {
        try {
          // Unix 기반 시스템에서 프로세스 종료
          process.kill(childProcess.pid);
        } catch (e) {
          console.log('프로세스 종료 실패:', e);
        }
      }
      
      const timeoutError = new Error(`Command timed out after ${timeout}ms: ${command}`);
      // @ts-ignore
      timeoutError.code = 'TIMEOUT';
      reject(timeoutError);
    }, timeout);

    // 프로세스가 종료되면 타이머 제거
    childProcess.on('close', () => clearTimeout(timer));
  });
}

/**
 * 사용자 입력 처리 (CLI용)
 */
async function confirmAction(question: string): Promise<boolean> {
  // CLI에서만 사용
  if (process.stdin.isTTY) {
    return new Promise((resolve) => {
      process.stdout.write(`${question} `);
      
      const listener = (data: Buffer) => {
        const answer = data.toString().trim().toLowerCase();
        process.stdin.removeListener('data', listener);
        process.stdin.pause();
        resolve(answer === 'y' || answer === 'yes');
      };
      
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', listener);
    });
  } else {
    // TTY가 아닌 환경에서는 기본적으로 허용
    return true;
  }
} 