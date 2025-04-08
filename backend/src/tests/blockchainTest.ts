import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';

// .env 파일 로드
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * 블록체인 연결 테스트 함수
 * RPC URL을 통해 이더리움 네트워크에 연결하고 기본 정보를 확인합니다.
 */
async function testConnection() {
  try {
    console.log('블록체인 연결 테스트 시작...');
    
    // 환경 변수 확인
    const rpcUrl = process.env.RPC_URL;
    if (!rpcUrl) {
      throw new Error('RPC_URL 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
    }
    
    // 프로바이더 설정
    console.log(`RPC URL: ${rpcUrl}`);
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    // 현재 블록 번호 가져오기
    const blockNumber = await provider.getBlockNumber();
    console.log('현재 블록 번호:', blockNumber);
    
    // 네트워크 정보 가져오기
    const network = await provider.getNetwork();
    console.log('연결된 네트워크:', network.name, '(체인 ID:', network.chainId, ')');
    
    // Gas 가격 가져오기
    const gasPrice = await provider.getGasPrice();
    console.log('현재 Gas 가격:', ethers.utils.formatUnits(gasPrice, 'gwei'), 'gwei');
    
    // DAO 컨트랙트 주소 확인
    const daoContractAddress = process.env.DAO_CONTRACT_ADDRESS;
    if (daoContractAddress) {
      console.log('DAO 컨트랙트 주소:', daoContractAddress);
      
      // 컨트랙트 코드 확인 (코드가 있으면 유효한 컨트랙트)
      const code = await provider.getCode(daoContractAddress);
      if (code !== '0x') {
        console.log('DAO 컨트랙트 코드 확인: 유효한 컨트랙트입니다.');
      } else {
        console.warn('DAO 컨트랙트 코드 확인: 해당 주소에 코드가 없습니다. 주소를 확인하세요.');
      }
    } else {
      console.warn('DAO_CONTRACT_ADDRESS 환경 변수가 설정되지 않았습니다.');
    }
    
    console.log('블록체인 연결 테스트 성공!');
  } catch (error) {
    console.error('블록체인 연결 테스트 실패:', error);
  }
}

// 테스트 실행
testConnection()
  .then(() => {
    console.log('테스트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('테스트 중 오류 발생:', error);
    process.exit(1);
  }); 