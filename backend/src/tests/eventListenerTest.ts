import { setupEventListeners } from '../services/blockchainSync';
import { ethers } from 'ethers';
import DAOABI from '../utils/abis/DAO.json';
import dotenv from 'dotenv';
import path from 'path';

// .env 파일 로드
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * 이벤트 리스너 테스트 함수
 * DAO 컨트랙트의 이벤트 리스너를 설정하고 이벤트 수신을 대기합니다.
 * 개선된 버전: 더 많은 디버깅 정보 출력 및 이벤트 데이터 타입 확인
 */
async function testEventListeners() {
  try {
    console.log('이벤트 리스너 테스트 시작...');
    
    // 환경 변수 확인
    const rpcUrl = process.env.RPC_URL;
    const daoContractAddress = process.env.DAO_CONTRACT_ADDRESS;
    
    if (!rpcUrl) {
      throw new Error('RPC_URL 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
    }
    
    if (!daoContractAddress) {
      throw new Error('DAO_CONTRACT_ADDRESS 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
    }
    
    console.log('이벤트 리스너 설정 중...');
    console.log(`- RPC URL: ${rpcUrl}`);
    console.log(`- DAO 컨트랙트 주소: ${daoContractAddress}`);
    
    // 1. 컨트랙트 연결 상태 확인
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const daoContract = new ethers.Contract(
      daoContractAddress, 
      DAOABI,
      provider
    );
    
    // 체인 ID 확인으로 블록체인 연결 검증
    const network = await provider.getNetwork();
    console.log(`- 연결된 네트워크: ${network.name} (chainId: ${network.chainId})`);
    
    // 컨트랙트 인터페이스 확인
    const hasProposalCreated = daoContract.interface.events['ProposalCreated(uint256,string,uint256)'] !== undefined;
    const hasProposalClosed = daoContract.interface.events['ProposalClosed(uint256)'] !== undefined;
    const hasVoted = daoContract.interface.events['Voted(uint256,address,uint256)'] !== undefined;
    
    console.log('\n컨트랙트 이벤트 인터페이스 확인:');
    console.log(`- ProposalCreated 이벤트 존재: ${hasProposalCreated ? '✅' : '❌'}`);
    console.log(`- ProposalClosed 이벤트 존재: ${hasProposalClosed ? '✅' : '❌'}`);
    console.log(`- Voted 이벤트 존재: ${hasVoted ? '✅' : '❌'}`);
    
    if (!hasProposalCreated || !hasProposalClosed || !hasVoted) {
      console.warn('⚠️ 일부 이벤트가 컨트랙트 인터페이스에 존재하지 않습니다.');
      console.warn('이는 ABI가 최신 버전이 아니거나 컨트랙트와 일치하지 않을 수 있음을 의미합니다.');
    }
    
    // 2. 향상된 이벤트 리스너 설정
    console.log('\n이벤트 리스너 설정 및 테스트 중...');
    
    // 원래의 이벤트 리스너 설정
    setupEventListeners();
    
    // 추가 디버깅을 위한 직접 리스닝
    daoContract.on('ProposalCreated', (proposalId, description, voteEndTime, ...args) => {
      console.log('\n[DEBUG] ProposalCreated 이벤트 수신:');
      console.log(`- 이벤트 인수 타입:`);
      console.log(`  - proposalId: ${typeof proposalId}, 값: ${proposalId.toString()}`);
      console.log(`  - description: ${typeof description}, 값: ${description}`);
      console.log(`  - voteEndTime: ${typeof voteEndTime}, 값: ${voteEndTime.toString()}`);
      
      if (args.length > 0) {
        console.log(`- 추가 인수: ${args.length}개`);
        args.forEach((arg, index) => {
          console.log(`  - 인수 ${index}: ${typeof arg}, 값: ${arg.toString()}`);
        });
      }
    });
    
    daoContract.on('Voted', (proposalId, voter, option, ...args) => {
      console.log('\n[DEBUG] Voted 이벤트 수신:');
      console.log(`- 이벤트 인수 타입:`);
      console.log(`  - proposalId: ${typeof proposalId}, 값: ${proposalId.toString()}`);
      console.log(`  - voter: ${typeof voter}, 값: ${voter}`);
      console.log(`  - option: ${typeof option}, 값: ${option.toString()}, 타입 확인: ${option.toNumber ? 'BigNumber' : '일반값'}`);
      
      if (args.length > 0) {
        console.log(`- 추가 인수: ${args.length}개`);
        args.forEach((arg, index) => {
          console.log(`  - 인수 ${index}: ${typeof arg}, 값: ${arg.toString()}`);
        });
      }
    });
    
    console.log('\n이벤트 리스너 설정 완료!');
    console.log('이벤트 수신 대기 중... (Ctrl+C로 종료)');
    console.log('');
    console.log('대기할 수 있는 이벤트:');
    console.log('1. ProposalCreated - 새로운 제안이 생성되었을 때');
    console.log('2. ProposalClosed - 제안이 종료되었을 때');
    console.log('3. Voted - 투표가 이루어졌을 때');
    console.log('');
    console.log('각 이벤트가 발생하면 상세 정보가 표시됩니다.');
    console.log('이 테스트를 실행한 상태에서 다른 터미널에서 transactionTest.ts를 실행해보세요.');
    
    // 프로그램이 계속 실행되도록 함
    process.stdin.resume();
    
    // 정상 종료를 위한 시그널 핸들러
    process.on('SIGINT', () => {
      console.log('\n이벤트 리스너 테스트를 종료합니다.');
      process.exit(0);
    });
  } catch (error) {
    console.error('이벤트 리스너 테스트 실패:', error);
    process.exit(1);
  }
}

// 테스트 실행
testEventListeners(); 