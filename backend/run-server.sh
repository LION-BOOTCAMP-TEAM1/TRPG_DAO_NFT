#!/bin/bash

# 메모리 누수 방지 및 모니터링을 위한 서버 직접 실행 스크립트
# 사용법: ./run-server.sh [--with-memory-check] [--low-memory]

# 디렉토리 이동
cd "$(dirname "$0")"

# 환경 변수 설정
export NODE_ENV=production
export SKIP_DB_SYNC=true

# 메모리 모드 선택
MEMORY_SIZE=4096
if [ "$1" == "--low-memory" ] || [ "$2" == "--low-memory" ]; then
  MEMORY_SIZE=2048
  echo "저메모리 모드로 실행합니다 (${MEMORY_SIZE}MB)..."
else
  echo "기본 메모리 모드로 실행합니다 (${MEMORY_SIZE}MB)..."
fi

# 추가 Node.js 옵션
NODE_OPTIONS="--max-old-space-size=${MEMORY_SIZE} --optimize-for-size --gc-interval=100"

# 메모리 모니터링도 함께 실행할지 확인
if [ "$1" == "--with-memory-check" ] || [ "$2" == "--with-memory-check" ]; then
  echo "서버와 메모리 모니터링을 함께 실행합니다..."
  
  # 서버 백그라운드로 실행
  node --expose-gc $NODE_OPTIONS dist/src/server.js &
  SERVER_PID=$!
  
  # 메모리 모니터링 실행
  node --expose-gc scripts/memory-check.js
  
  # 서버 프로세스 종료
  kill $SERVER_PID
else
  echo "서버만 실행합니다..."
  node --expose-gc $NODE_OPTIONS dist/src/server.js
fi 