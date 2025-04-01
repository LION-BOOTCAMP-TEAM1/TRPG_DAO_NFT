#!/usr/bin/env node

/**
 * 데이터베이스 연결 상태 확인 및 정리 스크립트
 * 
 * 사용법: node scripts/db-check.js [options]
 * 옵션:
 *   --cleanup    연결 정리 모드 활성화 (기본: 확인만)
 *   --force      강제 연결 종료 시도 (위험! 주의해서 사용)
 */

// 필요한 모듈
const { Client } = require('pg');
require('dotenv').config();

// 환경 변수 및 명령행 인자 처리
const CLEANUP_MODE = process.argv.includes('--cleanup');
const FORCE_MODE = process.argv.includes('--force');
const CONNECTION_LIMIT = process.env.DB_POOL_SIZE || 5;

// 연결 문자열 결정 (NODE_ENV에 따라)
const isProduction = process.env.NODE_ENV === 'production';
const isRender = process.env.IS_RENDER === 'true' || process.env.RENDER === 'true';
const connectionString = (isProduction || isRender)
  ? process.env.DATABASE_URL
  : process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('오류: DATABASE_URL 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

console.log('=== 데이터베이스 연결 확인 시작 ===');
console.log(`환경: ${isProduction ? '프로덕션' : '개발'}`);
console.log(`연결 정리 모드: ${CLEANUP_MODE ? '활성화' : '비활성화'}`);
if (FORCE_MODE) console.log('⚠️ 강제 모드 활성화! 주의하세요.');

async function main() {
  console.log('데이터베이스에 연결 중...');
  
  // 관리용 클라이언트 (일반 pg 클라이언트 사용)
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 10000, // 연결 타임아웃 10초
    statement_timeout: 10000, // 쿼리 타임아웃 10초
  });

  try {
    // 연결
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공');
    
    // 버전 확인
    const versionResult = await client.query('SELECT version()');
    console.log(`📊 데이터베이스 버전: ${versionResult.rows[0].version.split(',')[0]}`);

    // 현재 연결 수 확인
    const connectionsResult = await client.query(`
      SELECT count(*) as count 
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `);
    
    const connectionCount = parseInt(connectionsResult.rows[0].count);
    console.log(`📊 현재 연결 수: ${connectionCount}`);
    
    if (connectionCount > CONNECTION_LIMIT) {
      console.log(`⚠️ 경고: 연결 제한(${CONNECTION_LIMIT})을 초과했습니다.`);
      
      // 연결 상세 정보 확인
      const detailedResult = await client.query(`
        SELECT 
          pid,
          application_name,
          state,
          EXTRACT(EPOCH FROM (now() - query_start)) as duration_sec,
          SUBSTRING(query, 1, 100) as query_preview
        FROM 
          pg_stat_activity 
        WHERE 
          datname = current_database()
        ORDER BY 
          state, duration_sec DESC
      `);
      
      // 연결 정보 표시
      console.log('\n연결 상태 요약:');
      let stateCount = {};
      
      detailedResult.rows.forEach(row => {
        stateCount[row.state] = (stateCount[row.state] || 0) + 1;
      });
      
      for (const [state, count] of Object.entries(stateCount)) {
        console.log(`- ${state || '상태 없음'}: ${count}개`);
      }
      
      // 비활성 연결 확인
      const idleResult = await client.query(`
        SELECT count(*) as count 
        FROM pg_stat_activity 
        WHERE 
          datname = current_database() AND
          state = 'idle' AND
          EXTRACT(EPOCH FROM (now() - state_change)) > 300
      `);
      
      const idleCount = parseInt(idleResult.rows[0].count);
      console.log(`📊 5분 이상 유휴 상태 연결: ${idleCount}개`);
      
      // 정리 모드에서 비활성 연결 종료
      if (CLEANUP_MODE && idleCount > 0) {
        console.log('🧹 장기 유휴 연결 정리 중...');
        
        if (FORCE_MODE) {
          // 강제 종료 쿼리
          await client.query(`
            SELECT pg_terminate_backend(pid) 
            FROM pg_stat_activity 
            WHERE 
              datname = current_database() AND
              pid <> pg_backend_pid() AND
              state = 'idle' AND
              EXTRACT(EPOCH FROM (now() - state_change)) > 300
          `);
        } else {
          // 정상 종료 쿼리
          await client.query(`
            SELECT pg_cancel_backend(pid) 
            FROM pg_stat_activity 
            WHERE 
              datname = current_database() AND
              pid <> pg_backend_pid() AND
              state = 'idle' AND
              EXTRACT(EPOCH FROM (now() - state_change)) > 300
          `);
        }
        
        // 정리 후 연결 수 재확인
        const afterCleanupResult = await client.query(`
          SELECT count(*) as count 
          FROM pg_stat_activity 
          WHERE datname = current_database()
        `);
        
        const afterCleanupCount = parseInt(afterCleanupResult.rows[0].count);
        console.log(`📊 정리 후 연결 수: ${afterCleanupCount}`);
        console.log(`🧹 제거된 연결: ${connectionCount - afterCleanupCount}개`);
      }
    } else {
      console.log(`✅ 연결 수가 제한(${CONNECTION_LIMIT}) 이내입니다.`);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  } finally {
    // 항상 연결 종료
    try {
      await client.end();
      console.log('연결 종료 완료');
    } catch (err) {
      console.error('연결 종료 중 오류:', err);
    }
  }
  
  console.log('=== 데이터베이스 확인 완료 ===');
}

// 스크립트 실행
main().catch(error => {
  console.error('치명적 오류:', error);
  process.exit(1);
}); 