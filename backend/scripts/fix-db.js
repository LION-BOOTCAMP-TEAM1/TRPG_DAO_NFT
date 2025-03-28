#!/usr/bin/env node

/**
 * 데이터베이스 문제 해결 스크립트
 * 
 * 이 스크립트는 Prisma 관련 오류를 해결하고 데이터베이스를 정상화하는 데 도움을 줍니다.
 * 
 * 사용법:
 * node fix-db.js [명령]
 * 
 * 명령:
 * - clean: Prisma 캐시와 생성된 파일을 정리합니다
 * - reset: 데이터베이스를 리셋하고 마이그레이션을 다시 적용합니다
 * - force: Prisma 강제 생성 및 마이그레이션을 실행합니다
 * - no-args: 모든 작업을 순차적으로 실행합니다
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

// 현재 디렉토리 경로 (실행 명령이 이 파일의 위치를 기준으로 함)
const currentDir = __dirname;
const backendDir = path.join(currentDir, '..');
const nodeModulesDir = path.join(backendDir, 'node_modules');
const prismaDir = path.join(nodeModulesDir, '.prisma');

// 사용자 입력 처리를 위한 인터페이스
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 사용자 확인 함수
function askConfirmation(question) {
  return new Promise((resolve) => {
    rl.question(`${question} (y/n) `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// 명령 실행 함수
function executeCommand(command, options = {}) {
  const { silent = false } = options;
  
  try {
    console.log(`실행: ${command}`);
    const output = execSync(command, {
      cwd: backendDir,
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf8'
    });
    
    if (silent) {
      return output;
    }
    return true;
  } catch (error) {
    console.error(`명령 실행 실패: ${command}`);
    console.error(`오류: ${error.message}`);
    return false;
  }
}

// Prisma 캐시 정리
async function cleanPrisma() {
  console.log('\n===== Prisma 캐시 정리 =====');
  
  if (fs.existsSync(prismaDir)) {
    console.log(`Prisma 디렉토리 발견: ${prismaDir}`);
    
    const shouldDelete = await askConfirmation('Prisma 캐시 디렉토리를 삭제하시겠습니까?');
    
    if (shouldDelete) {
      try {
        // Windows의 경우 강제 삭제를 위해 rimraf 사용 (설치되어 있다면)
        if (process.platform === 'win32') {
          try {
            executeCommand('npx rimraf .prisma', { silent: true });
          } catch (error) {
            // rimraf가 없으면 rd 명령어 사용
            executeCommand('rd /s /q ".prisma"', { silent: true });
          }
        } else {
          // Unix 계열
          executeCommand('rm -rf .prisma', { silent: true });
        }
        
        console.log('Prisma 캐시가 성공적으로 삭제되었습니다.');
      } catch (error) {
        console.error('Prisma 캐시 삭제 중 오류 발생:', error.message);
      }
    }
  } else {
    console.log('Prisma 캐시 디렉토리가 존재하지 않습니다.');
  }
}

// Prisma 클라이언트 재생성
async function regeneratePrisma() {
  console.log('\n===== Prisma 클라이언트 재생성 =====');
  
  // 먼저 node_modules/.prisma 디렉토리 존재 여부 확인
  if (fs.existsSync(prismaDir)) {
    const shouldRegenerate = await askConfirmation('Prisma 클라이언트를 재생성하시겠습니까?');
    
    if (shouldRegenerate) {
      // Prisma 강제 생성
      console.log('Prisma 클라이언트 강제 재생성 중...');
      executeCommand('npx prisma generate --force');
      console.log('Prisma 클라이언트 재생성 완료');
    }
  } else {
    console.log('Prisma 디렉토리가 존재하지 않습니다. 표준 생성 실행 중...');
    executeCommand('npx prisma generate');
  }
}

// 데이터베이스 리셋
async function resetDatabase() {
  console.log('\n===== 데이터베이스 리셋 =====');
  
  const shouldReset = await askConfirmation('데이터베이스를 리셋하고 모든 데이터를 초기화하시겠습니까? (주의: 모든 데이터가 삭제됩니다)');
  
  if (shouldReset) {
    console.log('데이터베이스 리셋 중...');
    executeCommand('npx prisma migrate reset --force');
    console.log('데이터베이스 리셋 완료');
  }
}

// 데이터베이스 시드
async function seedDatabase() {
  console.log('\n===== 데이터베이스 시드 =====');
  
  const shouldSeed = await askConfirmation('시드 데이터를 적용하시겠습니까?');
  
  if (shouldSeed) {
    console.log('시드 데이터 적용 중...');
    executeCommand('npm run seed');
    console.log('시드 데이터 적용 완료');
  }
}

// 주 함수
async function main() {
  const arg = process.argv[2];
  
  console.log('=== Prisma 및 데이터베이스 문제 해결 도구 ===');
  
  try {
    switch (arg) {
      case 'clean':
        await cleanPrisma();
        break;
        
      case 'regenerate':
        await regeneratePrisma();
        break;
        
      case 'reset':
        await resetDatabase();
        break;
        
      case 'seed':
        await seedDatabase();
        break;
        
      case 'force':
        await cleanPrisma();
        await regeneratePrisma();
        break;
        
      default:
        // 인수가 없으면 모든 작업 수행
        console.log('전체 데이터베이스 복구 프로세스를 시작합니다...');
        await cleanPrisma();
        await regeneratePrisma();
        await resetDatabase();
        await seedDatabase();
        break;
    }
    
    console.log('\n작업이 완료되었습니다.');
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    rl.close();
  }
}

// 실행
main(); 