#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Render.com 환경 확인
const isRender = process.env.RENDER === 'true';
console.log(`현재 환경: ${isRender ? 'Render.com' : '로컬'}`);

// 시스템 정보 수집
console.log('\n===== 시스템 정보 =====');
console.log(`Node.js 버전: ${process.version}`);
console.log(`메모리 사용량: ${JSON.stringify(process.memoryUsage())}`);
console.log(`작업 디렉토리: ${process.cwd()}`);
console.log(`플랫폼: ${process.platform}`);

// 환경 변수 확인 (민감 정보 필터링)
console.log('\n===== 환경 변수 =====');
const safeEnvKeys = ['NODE_ENV', 'PORT', 'SKIP_DB_SYNC', 'IS_RENDER'];
safeEnvKeys.forEach(key => {
  console.log(`${key}: ${process.env[key] || '설정되지 않음'}`);
});

// DATABASE_URL은 민감 정보이므로 존재 여부만 확인
console.log(`DATABASE_URL 설정됨: ${!!process.env.DATABASE_URL}`);
if (process.env.DATABASE_URL) {
  const dbUrlStart = process.env.DATABASE_URL.substring(0, 20);
  console.log(`DATABASE_URL 시작 부분: ${dbUrlStart}...`);
}

// 파일 시스템 확인
console.log('\n===== 파일 시스템 =====');
const directories = [
  'dist',
  'dist/src',
  'prisma',
  'static'
];

directories.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  try {
    if (fs.existsSync(dirPath)) {
      const stats = fs.statSync(dirPath);
      console.log(`✅ ${dir}: 존재함 (${stats.isDirectory() ? '디렉토리' : '파일'})`);
      
      // 디렉토리인 경우 내용 확인
      if (stats.isDirectory()) {
        const files = fs.readdirSync(dirPath).slice(0, 5); // 처음 5개만 표시
        console.log(`   내용: ${files.join(', ')}${files.length > 5 ? '...' : ''}`);
      }
    } else {
      console.log(`❌ ${dir}: 존재하지 않음`);
    }
  } catch (error) {
    console.error(`❌ ${dir} 확인 중 오류: ${error.message}`);
  }
});

// 포트 상태 확인
console.log('\n===== 포트 상태 =====');
try {
  const netstatOutput = execSync('netstat -tuln').toString();
  console.log(netstatOutput);
} catch (error) {
  console.log('포트 상태 확인 실패:', error.message);
}

// 네트워크 연결 테스트
console.log('\n===== 네트워크 연결 테스트 =====');
try {
  console.log('DB 서버 접근성 테스트...');
  if (process.env.DATABASE_URL) {
    const dbUrl = new URL(process.env.DATABASE_URL);
    const pingResult = execSync(`ping -c 1 ${dbUrl.hostname}`).toString();
    console.log(pingResult);
  } else {
    console.log('DATABASE_URL이 설정되지 않아 테스트를 건너뜁니다.');
  }
} catch (error) {
  console.log('네트워크 테스트 실패:', error.message);
}

console.log('\n===== 진단 완료 ====='); 