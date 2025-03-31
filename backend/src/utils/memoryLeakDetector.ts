/**
 * 메모리 누수 감지 유틸리티
 * 이전 메모리 측정값을 추적하여 지속적인 메모리 증가 패턴을 감지
 */

import { forceGC, createTrackedTimeout } from './intervalManager';

// 이전 메모리 측정 기록 (WeakMap 사용 고려)
let memoryHistory: { timestamp: number; heapUsed: number; rss: number }[] = [];
const MAX_HISTORY_LENGTH = 8; // 기록 보관 개수 축소
let isTrackingInProgress = false;

/**
 * 메모리 사용량 추적 및 누수 감지
 * 연속적인 메모리 증가 패턴을 감지
 */
export function trackMemoryUsage(): void {
  // 중복 실행 방지
  if (isTrackingInProgress) {
    console.log('메모리 추적이 이미 진행 중입니다. 중복 실행 방지');
    return;
  }
  
  isTrackingInProgress = true;
  
  // GC 실행 후 메모리 측정
  forceGC();
  
  // 지연 측정으로 GC 효과 반영
  createTrackedTimeout(() => {
    try {
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const rssMB = Math.round(memoryUsage.rss / 1024 / 1024);
      const timestamp = Date.now();
      
      // 히스토리에 추가
      memoryHistory.push({ timestamp, heapUsed: heapUsedMB, rss: rssMB });
      
      // 기록 제한
      if (memoryHistory.length > MAX_HISTORY_LENGTH) {
        memoryHistory.shift();
      }
      
      // 최소 4개 이상의 데이터가 있을 때만 분석
      if (memoryHistory.length >= 4) {
        analyzeMemoryTrend();
      }
    } catch (e) {
      console.error('메모리 사용량 추적 중 오류:', e);
    } finally {
      isTrackingInProgress = false;
    }
  }, 2000); // 2초 지연으로 GC가 더 효과적으로 작동하도록 함
}

/**
 * 메모리 사용 추세 분석
 * 지속적인 증가 패턴을 감지하여 잠재적 메모리 누수 경고
 */
function analyzeMemoryTrend(): void {
  try {
    // 연속 증가 횟수 확인
    let increasingHeapCount = 0;
    let increasingRssCount = 0;
    
    for (let i = 1; i < memoryHistory.length; i++) {
      if (memoryHistory[i].heapUsed > memoryHistory[i - 1].heapUsed) {
        increasingHeapCount++;
      }
      if (memoryHistory[i].rss > memoryHistory[i - 1].rss) {
        increasingRssCount++;
      }
    }
    
    // 75% 이상의 측정에서 힙과 RSS 모두 증가 패턴이 발견되면 경고
    const compareCount = memoryHistory.length - 1;
    const heapIncreasePercentage = (increasingHeapCount / compareCount) * 100;
    const rssIncreasePercentage = (increasingRssCount / compareCount) * 100;
    
    if (heapIncreasePercentage >= 75 && rssIncreasePercentage >= 75) {
      console.warn('===== 잠재적 메모리 누수 감지 =====');
      console.warn(`최근 ${memoryHistory.length}회 측정 중 힙 ${increasingHeapCount}회(${heapIncreasePercentage.toFixed(1)}%), RSS ${increasingRssCount}회(${rssIncreasePercentage.toFixed(1)}%) 증가 패턴 감지`);
      console.warn('메모리 히스토리:');
      
      memoryHistory.forEach((record, index) => {
        const date = new Date(record.timestamp).toISOString();
        const heapDiff = index > 0 
          ? (record.heapUsed - memoryHistory[index - 1].heapUsed) 
          : 0;
        const rssDiff = index > 0 
          ? (record.rss - memoryHistory[index - 1].rss) 
          : 0;
        const heapDiffStr = heapDiff > 0 ? `+${heapDiff}MB` : `${heapDiff}MB`;
        const rssDiffStr = rssDiff > 0 ? `+${rssDiff}MB` : `${rssDiff}MB`;
        console.warn(`  [${date}] 힙: ${record.heapUsed}MB (${heapDiffStr}), RSS: ${record.rss}MB (${rssDiffStr})`);
      });
      
      // 첫 번째와 마지막 기록 사이의 총 증가량
      const totalHeapIncrease = memoryHistory[memoryHistory.length - 1].heapUsed - memoryHistory[0].heapUsed;
      const totalRssIncrease = memoryHistory[memoryHistory.length - 1].rss - memoryHistory[0].rss;
      const timeSpanMinutes = (memoryHistory[memoryHistory.length - 1].timestamp - memoryHistory[0].timestamp) / 60000;
      
      console.warn(`총 증가량: 힙 ${totalHeapIncrease}MB, RSS ${totalRssIncrease}MB (${timeSpanMinutes.toFixed(1)}분 동안)`);
      console.warn('증가율: 분당 힙 ' + (totalHeapIncrease / timeSpanMinutes).toFixed(2) + 'MB, RSS ' + (totalRssIncrease / timeSpanMinutes).toFixed(2) + 'MB');
      console.warn('=================================');
      
      // 심각한 누수가 감지되면 GC 강제 실행 및 메모리 정리
      if (totalHeapIncrease > 100 || totalRssIncrease > 200) {
        console.warn('심각한 메모리 증가 감지. 가비지 컬렉션 강제 실행 및 히스토리 초기화...');
        // 메모리 히스토리 정리
        memoryHistory = memoryHistory.slice(-2); // 마지막 2개만 보존
        forceGC();
      }
    }
  } catch (e) {
    console.error('메모리 추세 분석 중 오류:', e);
  }
}

/**
 * 메모리 사용량 요약 보고서
 * 현재 메모리 사용량에 대한 자세한 보고서 생성
 */
export function generateMemoryReport(): string {
  try {
    const memoryUsage = process.memoryUsage();
    
    // GC 힌트 추가
    forceGC();
    
    const report = [
      '===== 메모리 사용량 보고서 =====',
      `시간: ${new Date().toISOString()}`,
      `RSS (상주 세트 크기): ${formatMemory(memoryUsage.rss)}`,
      `Heap Total (총 힙 크기): ${formatMemory(memoryUsage.heapTotal)}`,
      `Heap Used (사용 중인 힙): ${formatMemory(memoryUsage.heapUsed)}`,
      `External (외부 메모리): ${formatMemory(memoryUsage.external)}`,
      `ArrayBuffers: ${formatMemory((memoryUsage as any).arrayBuffers || 0)}`,
      '==============================',
      '메모리 누수 감지 상태:',
      `  기록된 데이터 포인트: ${memoryHistory.length}/${MAX_HISTORY_LENGTH}`,
      '=============================='
    ];
    
    return report.join('\n');
  } catch (e) {
    console.error('메모리 보고서 생성 중 오류:', e);
    return '메모리 보고서 생성 중 오류가 발생했습니다.';
  }
}

/**
 * 메모리 크기를 읽기 쉬운 형식으로 변환
 */
function formatMemory(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
} 