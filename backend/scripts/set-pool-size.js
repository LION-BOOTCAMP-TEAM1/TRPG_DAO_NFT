#!/usr/bin/env node

/**
 * 데이터베이스 풀 사이즈 설정 스크립트
 * 
 * 이 스크립트는 .env 파일에 DB_POOL_SIZE를 설정합니다.
 * 또한 불필요한 연결을 정리하고 중복 클라이언트 방지를 위한 설정을 추가합니다.
 */

const fs = require('fs');
const path = require('path');

// 환경 파일 경로들
const envFiles = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), '.env.production'),
  path.join(process.cwd(), '.env.render')
];

// 추가하거나 업데이트할 환경 변수들
const envVarsToSet = {
  'DB_POOL_SIZE': '2',
  'MEMORY_DIAGNOSTICS': 'true',
  'NEON_SERVERLESS': 'true',
  'DB_IDLE_TIMEOUT': '60000'
};

// 명령행 인자 파싱
const args = process.argv.slice(2);
const poolSize = args.find(arg => arg.startsWith('--pool='))?.split('=')[1] || '2';
envVarsToSet.DB_POOL_SIZE = poolSize;

// 모든 환경 파일 업데이트
for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    updateEnvFile(envFile);
  } else {
    console.log(`환경 파일 ${envFile}을 찾을 수 없습니다. 건너뜁니다.`);
  }
}

// 환경 파일 업데이트 함수
function updateEnvFile(filePath) {
  console.log(`파일 업데이트 중: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 각 환경 변수에 대해 처리
  for (const [key, value] of Object.entries(envVarsToSet)) {
    const regex = new RegExp(`^${key}=.*`, 'm');
    
    if (content.match(regex)) {
      // 기존 값 업데이트
      content = content.replace(regex, `${key}=${value}`);
      console.log(`${key} 환경 변수 업데이트됨: ${value}`);
    } else {
      // 없으면 파일 맨 위에 추가
      content = `${key}=${value}\n${content}`;
      console.log(`${key} 환경 변수 추가됨: ${value}`);
    }
  }
  
  // 변경사항 저장
  fs.writeFileSync(filePath, content, 'utf8');
}

console.log(`\n모든 환경 파일이 업데이트되었습니다. DB_POOL_SIZE=${poolSize}로 설정됨`);
console.log(`
다음 단계:
1. 서버를 재시작하여 설정을 적용하세요.
2. 'node scripts/db-check.js --cleanup --force'로 연결을 정리하세요.
`); 