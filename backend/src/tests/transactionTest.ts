import { ethers } from 'ethers';
import DAOABI from '../utils/abis/DAO.json';
import dotenv from 'dotenv';
import path from 'path';
import readline from 'readline';

// .env 파일 로드
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// 사용자 입력을 위한 readline 인터페이스 설정
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * 트랜잭션 테스트 함수
 * DAO 컨트랙트에 테스트 제안을 생성하는 트랜잭션을 전송합니다.
 */
async function testTransaction() {
  try {
    console.log('블록체인 트랜잭션 테스트 시작...');
    
    // 환경 변수 확인
    const rpcUrl = process.env.RPC_URL;
    const daoContractAddress = process.env.DAO_CONTRACT_ADDRESS;
    const privateKey = process.env.CONTRACT_PRIVATE_KEY;
    
    if (!rpcUrl) {
      throw new Error('RPC_URL 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
    }
    
    if (!daoContractAddress) {
      throw new Error('DAO_CONTRACT_ADDRESS 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
    }
    
    if (!privateKey) {
      throw new Error('CONTRACT_PRIVATE_KEY 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
    }
    
    console.log('트랜잭션 준비 중...');
    console.log(`- RPC URL: ${rpcUrl}`);
    console.log(`- DAO 컨트랙트 주소: ${daoContractAddress}`);
    
    // 프로바이더 및 월렛 설정
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const daoContract = new ethers.Contract(
      daoContractAddress,
      DAOABI,
      wallet
    );
    
    // 월렛 정보 출력
    console.log(`- 사용 지갑 주소: ${wallet.address}`);
    const balance = await provider.getBalance(wallet.address);
    console.log(`- 지갑 잔액: ${ethers.utils.formatEther(balance)} ETH`);
    
    // 트랜잭션 전송 확인
    const confirmSend = await new Promise((resolve) => {
      rl.question('\n실제로 트랜잭션을 전송하시겠습니까? (y/n): ', (answer) => {
        resolve(answer.toLowerCase() === 'y');
      });
    });
    
    if (!confirmSend) {
      console.log('트랜잭션 전송이 취소되었습니다.');
      rl.close();
      return;
    }
    
    // 제안 정보 입력 받기
    const description = await new Promise((resolve) => {
      rl.question('제안 설명을 입력하세요: ', (answer) => {
        resolve(answer || '테스트 제안입니다');
      });
    });
    
    const durationInput = await new Promise((resolve) => {
      rl.question('투표 기간을 초 단위로 입력하세요 (기본값: 3600초): ', (answer) => {
        resolve(answer || '3600');
      });
    });
    const duration = parseInt(durationInput as string);
    
    const numOptionsInput = await new Promise((resolve) => {
      rl.question('투표 옵션 수를 입력하세요 (기본값: 3): ', (answer) => {
        resolve(answer || '3');
      });
    });
    const numOptions = parseInt(numOptionsInput as string);
    
    // 트랜잭션 전송
    console.log('\n트랜잭션 전송 중...');
    console.log(`- 제안 설명: ${description}`);
    console.log(`- 투표 기간: ${duration}초`);
    console.log(`- 투표 옵션 수: ${numOptions}`);
    console.log(`- 투표 가능 주소: ${wallet.address}`);
    
    const tx = await daoContract.createProposal(
      description,
      duration, 
      numOptions,
      [wallet.address] // 투표 가능한 주소 (본인)
    );
    
    console.log(`\n트랜잭션이 전송되었습니다!`);
    console.log(`- 트랜잭션 해시: ${tx.hash}`);
    console.log('- 트랜잭션 확인 대기 중...');
    
    // 트랜잭션 확인 대기
    const receipt = await tx.wait();
    console.log(`\n트랜잭션이 블록체인에 포함되었습니다!`);
    console.log(`- 블록 번호: ${receipt.blockNumber}`);
    console.log(`- 가스 사용량: ${receipt.gasUsed.toString()}`);
    
    // 이벤트에서 제안 ID 추출
    const event = receipt.events?.find((e: any) => e.event === 'ProposalCreated');
    if (event && event.args) {
      const proposalId = event.args.proposalId.toNumber();
      console.log(`\n제안이 성공적으로 생성되었습니다!`);
      console.log(`- 제안 ID: ${proposalId}`);
    } else {
      console.warn('\n트랜잭션은 성공했지만 이벤트를 찾을 수 없습니다.');
    }
    
    console.log('\n테스트 성공!');
  } catch (error) {
    console.error('블록체인 트랜잭션 테스트 실패:', error);
  } finally {
    rl.close();
  }
}

// 테스트 실행
testTransaction()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('테스트 중 오류 발생:', error);
    process.exit(1);
  }); 