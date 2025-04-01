/**
 * prisma-manager에서 정의된 Prisma 클라이언트 인스턴스를 재노출합니다.
 * 
 * 이 파일은 코드 호환성을 유지하기 위해 존재하며,
 * 모든 Prisma 인스턴스를 단일 소스로 통합하기 위해 src/utils/prisma-manager.ts로 리디렉션합니다.
 */

import { 
  prisma, 
  withTransaction, 
  testConnection,
  startConnectionCleanup,
  stopConnectionCleanup
} from './utils/prisma-manager';

// 이전 인터페이스와의 호환성을 위해 모든 기능 재노출
export { 
  prisma, 
  withTransaction, 
  testConnection,
  startConnectionCleanup,
  stopConnectionCleanup
};

// 기본 내보내기도 prisma-manager의 인스턴스로 설정
export default prisma;

// 초기화 시 로깅
console.log('[prismaClient] prisma-manager 싱글톤 인스턴스 사용 중');

// 서버 시작/종료 시 프로세스 이벤트 핸들러는 prisma-manager.ts에서 통합 관리하도록 이전됨
