import { setupNFTEventListeners } from '../services/nftService';
import dotenv from 'dotenv';
import path from 'path';

// .env 파일 로드
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * NFT 이벤트 리스너 테스트 함수
 * NFT 컨트랙트의 이벤트 리스너를 설정하고 이벤트 수신을 대기합니다.
 */
async function testNFTEventListeners() {
  try {
    console.log('NFT 이벤트 리스너 테스트 시작...');
    
    // 환경 변수 확인
    const rpcUrl = process.env.RPC_URL;
    const nftContractAddress = process.env.NFT_CONTRACT_ADDRESS;
    
    if (!rpcUrl) {
      throw new Error('RPC_URL 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
    }
    
    if (!nftContractAddress) {
      throw new Error('NFT_CONTRACT_ADDRESS 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
    }
    
    console.log('NFT 이벤트 리스너 설정 중...');
    console.log(`- RPC URL: ${rpcUrl}`);
    console.log(`- NFT 컨트랙트 주소: ${nftContractAddress}`);
    
    // 이벤트 리스너 설정
    setupNFTEventListeners();
    
    console.log('NFT 이벤트 리스너 설정 완료!');
    console.log('이벤트 수신 대기 중... (Ctrl+C로 종료)');
    console.log('');
    console.log('대기할 수 있는 이벤트:');
    console.log('1. minted - NFT가 민팅되었을 때');
    console.log('');
    console.log('이벤트가 발생하면 여기에 로그가 표시됩니다.');
    console.log('이제 API로 NFT를 민팅하면 여기서 이벤트를 확인할 수 있습니다.');
    
    // 프로그램이 계속 실행되도록 함
    process.stdin.resume();
    
    // 정상 종료를 위한 시그널 핸들러
    process.on('SIGINT', () => {
      console.log('\nNFT 이벤트 리스너 테스트를 종료합니다.');
      process.exit(0);
    });
  } catch (error) {
    console.error('NFT 이벤트 리스너 테스트 실패:', error);
    process.exit(1);
  }
}

// 테스트 실행
testNFTEventListeners(); 