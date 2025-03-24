import { exec } from 'child_process';
import { promisify } from 'util';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const execPromise = promisify(exec);
const prisma = new PrismaClient();

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

  try {
    console.log('데이터베이스 연결 확인 중...');
    
    // 데이터베이스 연결 테스트
    await prisma.$connect();
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
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Prisma 스키마 변경 여부 확인
 */
async function checkSchemaChanges(): Promise<boolean> {
  try {
    const { stdout } = await execPromise('npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma --exit-code');
    return false; // 변경 없음
  } catch (error: any) {
    if (error.code === 1) {
      return true; // 변경 감지됨
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
  
  if (isProduction) {
    // 프로덕션 환경에서는 deploy만 실행
    await execPromise('npx prisma migrate deploy');
    console.log('프로덕션 마이그레이션이 성공적으로 적용되었습니다.');
  } else {
    // 개발 환경에서는 스키마 변경사항을 반영하는 마이그레이션 생성
    const migrationName = `schema_update_${new Date().toISOString().replace(/[:.]/g, '_')}`;
    await execPromise(`npx prisma migrate dev --name ${migrationName}`);
    console.log('개발 마이그레이션이 성공적으로 생성 및 적용되었습니다.');
  }
}

/**
 * 시드 데이터 적용
 */
async function runSeed() {
  console.log('시드 데이터 적용 중...');
  await execPromise('npm run seed');
  console.log('시드 데이터가 성공적으로 적용되었습니다.');
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