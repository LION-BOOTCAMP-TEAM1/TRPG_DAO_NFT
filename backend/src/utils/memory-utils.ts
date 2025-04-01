/**
 * 메모리 관리 유틸리티
 * 
 * Node.js 애플리케이션의 메모리 사용량을 모니터링하고
 * 최적화하기 위한 유틸리티 함수들을 제공합니다.
 */

// 환경 변수
const LOG_MEMORY_USAGE = process.env.LOG_MEMORY_USAGE === 'true';
const MEMORY_LOG_INTERVAL = parseInt(process.env.MEMORY_LOG_INTERVAL || '300000'); // 5분
const MEMORY_GC_THRESHOLD = parseInt(process.env.MEMORY_GC_THRESHOLD || '75'); // 75% 이상 사용 시 GC 실행

// MB 단위로 변환하는 함수
const formatMemoryUsage = (bytes: number): string => {
  return `${Math.round(bytes / 1024 / 1024 * 100) / 100} MB`;
};

// 메모리 사용량 출력
export function logMemoryUsage(): void {
  const memoryUsage = process.memoryUsage();
  
  console.log(`\n=== ${new Date().toISOString()} - 메모리 사용량 ===`);
  console.log(`RSS: ${formatMemoryUsage(memoryUsage.rss)} - 전체 메모리 사용량`);
  console.log(`힙 총량: ${formatMemoryUsage(memoryUsage.heapTotal)} - V8에 할당된 총 힙`);
  console.log(`힙 사용량: ${formatMemoryUsage(memoryUsage.heapUsed)} - 실제 사용 중인 힙`);
  console.log(`외부 메모리: ${formatMemoryUsage(memoryUsage.external)} - C++ 객체 메모리`);
  
  if (memoryUsage.arrayBuffers) {
    console.log(`ArrayBuffers: ${formatMemoryUsage(memoryUsage.arrayBuffers)} - 버퍼 메모리`);
  }
  
  // 힙 사용률 계산
  const heapUsage = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);
  console.log(`힙 사용률: ${heapUsage}%`);
}

// 가비지 컬렉션 요청
export function requestGC(): void {
  if (typeof global.gc === 'function') {
    console.log('가비지 컬렉션 실행 중...');
    
    const before = process.memoryUsage().heapUsed;
    global.gc();
    const after = process.memoryUsage().heapUsed;
    
    const savedMB = Math.round((before - after) / 1024 / 1024);
    console.log(`GC 결과: ${savedMB}MB 메모리 확보됨`);
  } else {
    console.log('가비지 컬렉션 API에 접근할 수 없습니다. --expose-gc 옵션을 사용하세요.');
  }
}

// 메모리 사용량이 특정 임계값을 넘으면 GC 실행
export function checkAndRunGC(): void {
  const memoryUsage = process.memoryUsage();
  const heapUsage = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);
  
  if (heapUsage > MEMORY_GC_THRESHOLD) {
    console.log(`힙 사용률(${heapUsage}%)이 임계값(${MEMORY_GC_THRESHOLD}%)을 초과하여 GC 실행`);
    requestGC();
  }
}

// 주기적으로 메모리 사용량 로깅
export function startMemoryMonitoring(): NodeJS.Timeout | null {
  if (!LOG_MEMORY_USAGE) {
    return null;
  }
  
  console.log(`메모리 모니터링 시작 (${MEMORY_LOG_INTERVAL / 1000}초 간격)`);
  
  return setInterval(() => {
    logMemoryUsage();
    checkAndRunGC();
  }, MEMORY_LOG_INTERVAL);
}

// 메모리 모니터링 중지
export function stopMemoryMonitoring(intervalId: NodeJS.Timeout | null): void {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('메모리 모니터링 중지됨');
  }
}

export default {
  logMemoryUsage,
  requestGC,
  checkAndRunGC,
  startMemoryMonitoring,
  stopMemoryMonitoring
}; 