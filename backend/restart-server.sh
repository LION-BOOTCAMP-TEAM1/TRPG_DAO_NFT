#!/bin/bash

# 서버 재시작 스크립트 (메모리 누수 방지용)
# 사용법: ./restart-server.sh [--force] [--cleanup]

# 옵션 처리
FORCE_RESTART=false
CLEANUP_DB=false  # 데이터베이스 연결 정리 옵션 추가
MAX_RESTART_COUNT=5  # 하루 최대 재시작 횟수
RESTART_COUNT_FILE="./logs/restart_count.txt"
DATE_FORMAT=$(date +%Y-%m-%d)

# 인자 처리
for arg in "$@"; do
  case $arg in
    --force)
      FORCE_RESTART=true
      shift
      ;;
    --cleanup)
      CLEANUP_DB=true  # 데이터베이스 연결 정리 활성화
      shift
      ;;
  esac
done

# 로그 디렉토리 생성 (없는 경우)
mkdir -p ./logs

# 재시작 횟수 확인 로직
if [ -f "$RESTART_COUNT_FILE" ]; then
  # 파일 내용 분석
  LAST_DATE=$(head -n 1 "$RESTART_COUNT_FILE" | cut -d' ' -f1)
  COUNT=$(head -n 1 "$RESTART_COUNT_FILE" | cut -d' ' -f2)
  
  # 날짜가 같은 경우 카운트 증가, 다른 경우 리셋
  if [ "$LAST_DATE" == "$DATE_FORMAT" ]; then
    # 최대 재시작 횟수 확인
    if [ "$COUNT" -ge "$MAX_RESTART_COUNT" ] && [ "$FORCE_RESTART" == "false" ]; then
      echo "⚠️ 오늘($DATE_FORMAT) 이미 $COUNT번 재시작했습니다. 최대 횟수($MAX_RESTART_COUNT)에 도달했습니다."
      echo "서버 재시작을 건너뜁니다. --force 옵션을 사용하여 강제로 재시작할 수 있습니다."
      exit 1
    fi
    COUNT=$((COUNT + 1))
  else
    # 새 날짜면 카운트 리셋
    COUNT=1
  fi
else
  # 파일이 없으면 새로 만들고 카운트 1로 시작
  COUNT=1
fi

# 재시작 카운트 업데이트
echo "$DATE_FORMAT $COUNT" > "$RESTART_COUNT_FILE"
echo "🔄 서버 재시작 횟수: $COUNT/$MAX_RESTART_COUNT (날짜: $DATE_FORMAT)"

# 현재 실행 중인 서버 프로세스 확인
echo "🔍 현재 실행 중인 Node.js 프로세스 확인..."
NODE_PROCESSES=$(ps aux | grep "[n]ode dist/server.js" | awk '{print $2}')

if [ -z "$NODE_PROCESSES" ]; then
  echo "⚠️ 실행 중인 서버 프로세스를 찾을 수 없습니다."
else
  # 프로세스마다 확인
  for PID in $NODE_PROCESSES; do
    echo "🛑 프로세스 $PID 종료 중..."
    kill $PID
    
    # 프로세스가 종료될 때까지 대기
    for i in {1..10}; do
      if ! ps -p $PID > /dev/null; then
        echo "✅ 프로세스 $PID가 정상적으로 종료되었습니다."
        break
      fi
      
      echo "⏳ 프로세스 종료 대기 중... ($i/10)"
      sleep 1
    done
    
    # 10초 안에 종료되지 않으면 강제 종료
    if ps -p $PID > /dev/null; then
      echo "⚠️ 프로세스가 응답하지 않습니다. 강제 종료합니다."
      kill -9 $PID
    fi
  done
fi

# 데이터베이스 연결 정리 (선택적)
if [ "$CLEANUP_DB" == "true" ]; then
  echo "🧹 데이터베이스 연결 정리 중..."
  # Pool size 설정
  echo "🔧 데이터베이스 풀 크기 조정 중..."
  node scripts/set-pool-size.js --pool=2
  
  # DB 연결 정리
  node scripts/db-check.js --cleanup --force
  
  # 잠시 대기하여 연결이 완전히 종료되도록 함
  echo "⏳ 연결이 정리될 때까지 5초 대기 중..."
  sleep 5
fi

# 메모리 사용량 확인
echo "📊 메모리 사용량 확인..."
free -h

# 서버 재시작
echo "🚀 서버 재시작 중..."
# 백그라운드로 서버 시작 (별도의 터미널 창을 통해 로그 확인 가능)
nohup node dist/server.js > ./logs/server-$(date +%Y%m%d-%H%M%S).log 2>&1 &

# 서버 시작 확인
sleep 3  # 서버가 시작되기를 기다림
NEW_PID=$(ps aux | grep "[n]ode dist/server.js" | awk '{print $2}')

if [ -z "$NEW_PID" ]; then
  echo "❌ 서버 재시작에 실패했습니다."
  exit 1
else
  echo "✅ 서버가 재시작되었습니다. PID: $NEW_PID"
  # 서버 상태 확인
  echo "⏳ 서버 상태 확인 중..."
  sleep 2
  curl -s http://localhost:3000/api/health || echo "⚠️ 서버가 아직 준비되지 않았습니다. 로그를 확인하세요."
fi

echo "✅ 재시작 프로세스 완료!"