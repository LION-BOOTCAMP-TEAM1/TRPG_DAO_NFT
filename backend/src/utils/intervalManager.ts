/**
 * 인터벌 및 타이머 관리 유틸리티
 * 메모리 누수 방지를 위한 인터벌, 타이머 추적 및 정리 기능 제공
 */

// 모든 활성 인터벌 추적
export const activeIntervals = new Set<NodeJS.Timeout>();

// 모든 활성 타임아웃 추적
export const activeTimeouts = new Set<NodeJS.Timeout>();

/**
 * 추적 가능한 인터벌 생성 - 자동으로 activeIntervals에 등록됨
 * @param callback 실행할 콜백 함수
 * @param ms 인터벌 시간 (밀리초)
 * @returns 인터벌 ID
 */
export function createTrackedInterval(callback: () => void, ms: number): NodeJS.Timeout {
  const safeCallback = () => {
    try {
      callback();
    } catch (error) {
      console.error('[인터벌 오류 보호]', error);
    }
  };

  const interval = setInterval(safeCallback, ms);
  activeIntervals.add(interval);
  return interval;
}

/**
 * 인터벌 정리 및 추적 목록에서 제거
 * @param interval 정리할 인터벌 ID
 */
export function clearInterval(interval: NodeJS.Timeout): void {
  global.clearInterval(interval);
  activeIntervals.delete(interval);
}

/**
 * 추적 가능한 타임아웃 생성 - 실행 후 자동으로 activeTimeouts에서 제거됨
 * @param callback 실행할 콜백 함수
 * @param ms 지연 시간 (밀리초)
 * @returns 타임아웃 ID
 */
export function createTrackedTimeout(callback: () => void, ms: number): NodeJS.Timeout {
  const timeout = setTimeout(() => {
    try {
      callback();
    } catch (error) {
      console.error('[타임아웃 오류 보호]', error);
    } finally {
      // 실행 후 집합에서 제거
      activeTimeouts.delete(timeout);
    }
  }, ms);
  
  activeTimeouts.add(timeout);
  return timeout;
}

/**
 * 타임아웃 정리 및 추적 목록에서 제거
 * @param timeout 정리할 타임아웃 ID
 */
export function clearTimeout(timeout: NodeJS.Timeout): void {
  global.clearTimeout(timeout);
  activeTimeouts.delete(timeout);
}

/**
 * 모든 등록된 인터벌 정리
 */
export function clearAllIntervals(): void {
  console.log(`정리할 인터벌 수: ${activeIntervals.size}`);
  activeIntervals.forEach(interval => {
    global.clearInterval(interval);
  });
  activeIntervals.clear();
  console.log('모든 인터벌 정리 완료');
}

/**
 * 모든 등록된 타임아웃 정리
 */
export function clearAllTimeouts(): void {
  console.log(`정리할 타임아웃 수: ${activeTimeouts.size}`);
  activeTimeouts.forEach(timeout => {
    global.clearTimeout(timeout);
  });
  activeTimeouts.clear();
  console.log('모든 타임아웃 정리 완료');
}

/**
 * 모든 타이머 리소스 정리 (인터벌 + 타임아웃)
 */
export function clearAllTimers(): void {
  clearAllIntervals();
  clearAllTimeouts();
}

/**
 * GC 힌트 강제 실행 (--expose-gc 옵션 필요)
 */
export function forceGC(): void {
  try {
    if (global.gc) {
      console.log('수동 가비지 컬렉션 실행');
      global.gc();
    }
  } catch (error) {
    console.log('GC 실행 실패 - 런타임에 --expose-gc 옵션이 필요합니다');
  }
}

/**
 * 메모리 사용량 모니터링 인터벌 설정
 * @param thresholdMB 경고 표시할 메모리 임계값 (MB)
 * @param intervalMs 체크 주기 (밀리초)
 * @returns 인터벌 ID
 */
export function setupMemoryMonitoring(thresholdMB = 1500, intervalMs = 60000): NodeJS.Timeout {
  return createTrackedInterval(() => {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const rss = Math.round(memoryUsage.rss / 1024 / 1024);
    
    console.log(`[메모리 모니터링] RSS: ${rss}MB, Heap: ${heapUsedMB}MB/${heapTotalMB}MB`);
    
    // 메모리 임계값 초과 시 GC 힌트 및 경고
    if (heapUsedMB > thresholdMB) {
      console.warn(`[메모리 경고] Heap 사용량(${heapUsedMB}MB)이 임계값(${thresholdMB}MB)을 초과했습니다.`);
      forceGC();
    }
  }, intervalMs);
} 