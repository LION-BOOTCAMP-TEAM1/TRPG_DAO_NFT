import { syncBlockchainData } from '../services/blockchainSync';
import dotenv from 'dotenv';
import path from 'path';

// .env 파일 로드
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * 블록체인 동기화 테스트 함수
 * 블록체인에서 DAO 관련 이벤트를 조회하고 DB에 동기화합니다.
 */
async function testSync() {
  try {
    console.log('블록체인 동기화 테스트 시작...');
    
    // 환경 변수 확인
    const rpcUrl = process.env.RPC_URL;
    const daoContractAddress = process.env.DAO_CONTRACT_ADDRESS;
    
    if (!rpcUrl) {
      throw new Error('RPC_URL 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
    }
    
    if (!daoContractAddress) {
      throw new Error('DAO_CONTRACT_ADDRESS 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
    }
    
    console.log('블록체인 동기화 실행 중...');
    console.log(`- RPC URL: ${rpcUrl}`);
    console.log(`- DAO 컨트랙트 주소: ${daoContractAddress}`);
    
    // 동기화 실행
    console.log('이전 블록부터 현재 블록까지 이벤트 동기화를 시작합니다...');
    await syncBlockchainData();
    
    console.log('블록체인 동기화가 완료되었습니다!');
    
    // 추가 확인을 위한 2차 동기화 (선택적)
    const runSecondSync = process.argv.includes('--double-check');
    if (runSecondSync) {
      console.log('\n확인을 위한 2차 동기화를 실행합니다...');
      await syncBlockchainData();
      console.log('2차 동기화 완료! 이미 모든 이벤트가 처리되었다면 추가 로그가 없어야 합니다.');
    }
    
    console.log('\n테스트 성공!');
  } catch (error) {
    console.error('블록체인 동기화 테스트 실패:', error);
    process.exit(1);
  }
}

// 테스트 실행
testSync()
  .then(() => {
    console.log('테스트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('테스트 중 오류 발생:', error);
    process.exit(1);
  }); 