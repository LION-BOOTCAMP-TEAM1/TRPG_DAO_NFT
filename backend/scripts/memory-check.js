#!/usr/bin/env node

/**
 * 메모리 사용량 모니터링 스크립트
 * 
 * 사용법: node scripts/memory-check.js
 * 또는: NODE_ENV=production node --expose-gc scripts/memory-check.js
 */

// 프로세스에 대한 메모리 정보 주기적으로 출력
function printMemoryUsage() {
  const memoryUsage = process.memoryUsage();
  
  // 모든 값을 MB로 변환
  const formatMemoryUsage = (data) => `${Math.round(data / 1024 / 1024 * 100) / 100} MB`;
  
  const memoryData = {
    rss: `${formatMemoryUsage(memoryUsage.rss)} - 프로세스 전체 메모리 사용량`,
    heapTotal: `${formatMemoryUsage(memoryUsage.heapTotal)} - V8에 할당된 총 힙 크기`,
    heapUsed: `${formatMemoryUsage(memoryUsage.heapUsed)} - V8에서 사용중인 힙 크기`,
    external: `${formatMemoryUsage(memoryUsage.external)} - C++ 객체에 바인딩된 JS 객체가 사용하는 메모리`,
    arrayBuffers: `${formatMemoryUsage(memoryUsage.arrayBuffers || 0)} - ArrayBuffer 및 SharedArrayBuffer 크기`
  };
  
  console.log(`=== ${new Date().toISOString()} - 메모리 사용량 ===`);
  console.table(memoryData);
  
  // 힙 사용률 계산
  const heapUsage = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);
  console.log(`힙 사용률: ${heapUsage}%`);
  
  // 강제 GC 실행
  if (heapUsage > 75 && typeof global.gc === 'function') {
    console.log('힙 사용률이 높아 GC 실행...');
    global.gc();
    
    // GC 후 메모리 확인
    const afterGC = process.memoryUsage();
    const savedMem = Math.round((memoryUsage.heapUsed - afterGC.heapUsed) / 1024 / 1024);
    console.log(`GC 후 ${savedMem}MB 메모리 확보됨`);
  }
  
  console.log('=========================================');
}

// 5초마다 메모리 사용량 출력
const intervalId = setInterval(printMemoryUsage, 5000);

// 프로세스 종료 시 인터벌 정리
process.on('SIGINT', () => {
  clearInterval(intervalId);
  console.log('메모리 모니터링 종료');
  process.exit(0);
});

// 초기 정보 출력
console.log('메모리 모니터링 시작...');
console.log(`Node.js 버전: ${process.version}`);
console.log(`환경: ${process.env.NODE_ENV || 'development'}`);
console.log(`GC 접근 가능: ${typeof global.gc === 'function'}`);

// 첫 번째 측정 실행
printMemoryUsage(); 