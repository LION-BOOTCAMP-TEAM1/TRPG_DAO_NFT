/**
 * 메모리 분석 스크립트
 * 
 * 이 스크립트는 힙 덤프를 생성하고 분석하는 데 도움을 줍니다.
 * 
 * 사용법:
 * 1. 우선 필요한 패키지를 설치합니다: npm install heapdump memwatch-next
 * 2. 서버를 실행할 때 --inspect 플래그를 추가합니다:
 *    NODE_OPTIONS="--max-old-space-size=4096 --inspect" node --expose-gc dist/src/server.js
 * 3. 이 스크립트를 실행합니다: node scripts/analyze-memory.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 현재 시간을 사용하여 덤프 파일 이름 생성
const timestamp = new Date().toISOString().replace(/:/g, '-');
const dumpDir = path.join(__dirname, '../memory-dumps');
const dumpFileName = `heap-${timestamp}.heapsnapshot`;
const dumpPath = path.join(dumpDir, dumpFileName);

// 덤프 디렉토리 확인 및 생성
if (!fs.existsSync(dumpDir)) {
  console.log(`덤프 디렉토리 생성: ${dumpDir}`);
  fs.mkdirSync(dumpDir, { recursive: true });
}

console.log('===== 메모리 덤프 및 분석 도구 =====');
console.log('이 스크립트는 Node.js 메모리 누수를 분석하는 데 도움을 줍니다.');
console.log('\n기본 메모리 문제 해결 단계:');
console.log('1. Chrome DevTools를 사용하여 힙 덤프 생성');
console.log('   - Chrome에서 chrome://inspect 접속');
console.log('   - Remote Target에서 서버 인스턴스 찾기');
console.log('   - "inspect" 클릭하여 DevTools 열기');
console.log('   - Memory 탭에서 "Take heap snapshot" 사용');
console.log('2. 힙 스냅샷 분석:');
console.log('   - Detached HTMLElement: DOM 요소 누수');
console.log('   - (array): 배열 누수');
console.log('   - (closure): 클로저 관련 누수');
console.log('   - 크기별 객체 정렬 및 검사');

// Node.js 메모리 사용량 출력
try {
  console.log('\n===== 현재 메모리 사용량 =====');
  const memoryUsage = process.memoryUsage();
  
  console.log(`RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)} MB`);
  console.log(`Heap Total: ${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`);
  console.log(`Heap Used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`);
  console.log(`External: ${Math.round(memoryUsage.external / 1024 / 1024)} MB`);
  console.log('=============================');
} catch (error) {
  console.error('메모리 사용량 조회 실패:', error);
}

// 메모리 누수 진단을 위한 체크리스트
console.log('\n===== 메모리 누수 체크리스트 =====');
console.log('1. 이벤트 리스너가 제대로 정리되지 않음');
console.log('2. 타이머 (setTimeout/setInterval)가 정리되지 않음');
console.log('3. 클로저에 의한 의도치 않은 참조 유지');
console.log('4. 캐시나 배열/맵에 지속적으로 추가되지만 정리되지 않음');
console.log('5. 데이터베이스 연결이 명시적으로 닫히지 않음');
console.log('6. HTTP 요청 및 응답 객체가 오래 유지됨');
console.log('7. 순환 참조 (객체 간 상호 참조)');
console.log('================================');

// 로그 파일 분석을 위한 가이드
console.log('\n===== 로그 파일 분석 가이드 =====');
console.log('메모리 패턴을 확인하기 위해 다음을 검색하세요:');
console.log('1. "메모리 모니터링" 로그를 확인하여 지속적 증가 패턴 검색');
console.log('2. --trace-gc 출력에서 "Mark-Compact" 빈도 확인');
console.log('3. "잠재적 메모리 누수 감지" 경고 메시지 검색');
console.log('4. GC 실행 전후 메모리 차이 분석');
console.log('================================');

// 추가 도구 안내
console.log('\n===== 추가 분석 도구 =====');
console.log('1. clinic.js: npm install -g clinic');
console.log('   사용법: clinic doctor -- node dist/src/server.js');
console.log('2. Node.js --inspect 모드: --inspect 플래그로 서버 실행 후 Chrome DevTools 연결');
console.log('3. v8-profiler-next: 프로그래밍 방식으로 CPU/메모리 프로파일링');
console.log('=========================');

// 서버 메모리 사용량 테스트 방법
console.log('\n===== 메모리 테스트 방법 =====');
console.log('1. 서버를 --inspect 모드로 실행');
console.log('2. 로드 테스트 실행 (ab, wrk, autocannon 등 사용)');
console.log('3. 주기적으로 힙 스냅샷 캡처 및 비교');
console.log('4. 메모리 증가 발생 시 추가 분석 수행');
console.log('============================');

console.log('\n이 파일을 참조하여 메모리 누수 진단 및 해결에 활용하세요.');
console.log('자세한 내용은 Node.js 공식 문서 및 메모리 프로파일링 가이드를 참조하세요.'); 