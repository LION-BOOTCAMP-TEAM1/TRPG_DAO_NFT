#!/bin/bash

# Render 환경에 최적화된 서버 시작 스크립트
# 메모리 누수 방지 및 DB 연결 관리에 중점

# 스크립트가 있는 디렉토리로 이동
cd "$(dirname "$0")"

# 환경 변수 설정
export NODE_ENV=production
export SKIP_DB_SYNC=true
export IS_RENDER=true
export RENDER=true
export MEMORY_DIAGNOSTICS=true

# DB 연결 최적화 설정
export DB_POOL_SIZE=4
export DB_CONNECTION_TIMEOUT=30000
export DB_IDLE_TIMEOUT=30000
export NEON_POOL_TIMEOUT=30
export NEON_SERVERLESS=true

# 메모리 최적화 설정
export GC_INTERVAL=100
export MAX_OLD_SPACE_SIZE=496
export OPTIMIZE_FOR_SIZE=true

# 서버 시작 전 DB 연결 정리
echo "데이터베이스 연결 정리 중..."
node scripts/db-check.js --cleanup

# Node.js 메모리 옵션
NODE_OPTIONS="--max-old-space-size=496 --expose-gc --optimize-for-size --gc-interval=100"

# 실행할 기능 선택
if [ "$1" == "--with-monitor" ]; then
  echo "서버와 DB 모니터링을 함께 실행합니다..."
  
  # 서버 백그라운드로 실행
  node $NODE_OPTIONS dist/src/server.js &
  SERVER_PID=$!
  
  # DB 모니터링 10분 간격으로 실행
  node --expose-gc scripts/neon-monitor.js 10
  
  # 서버 종료
  if [ ! -z "$SERVER_PID" ]; then
    kill -15 $SERVER_PID
  fi
else
  echo "서버만 실행합니다..."
  
  # 메모리 사용량 로깅 활성화
  export LOG_MEMORY_USAGE=true
  
  # 서버 실행
  node $NODE_OPTIONS dist/src/server.js
fi 