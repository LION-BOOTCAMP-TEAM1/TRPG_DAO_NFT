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

// 사용자로부터 입력 받는 함수
const question = (query: string, defaultValue?: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer || defaultValue || '');
    });
  });
};

/**
 * 트랜잭션 테스트 함수
 * DAO 컨트랙트에 테스트 제안을 생성하거나 종료하는 트랜잭션을 전송합니다.
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
    
    // 테스트 종류 선택
    const testType = await question('\n어떤 테스트를 실행하시겠습니까? (1: 제안 생성, 2: 제안 종료, 3: 투표하기): ', '1');
    
    // 트랜잭션 전송 확인
    const confirmSend = await question('\n실제로 트랜잭션을 전송하시겠습니까? (y/n): ', 'n');
    
    if (confirmSend.toLowerCase() !== 'y') {
      console.log('트랜잭션 전송이 취소되었습니다.');
      rl.close();
      return;
    }
    
    let tx;
    let receipt;
    
    switch (testType) {
      case '1': // 제안 생성
        await testCreateProposal(daoContract, wallet);
        break;
        
      case '2': // 제안 종료
        await testCloseProposal(daoContract);
        break;
        
      case '3': // 투표하기
        await testVote(daoContract);
        break;
        
      default:
        console.log('잘못된 선택입니다. 기본값으로 제안 생성을 실행합니다.');
        await testCreateProposal(daoContract, wallet);
    }
    
    console.log('\n테스트 성공!');
  } catch (error) {
    console.error('블록체인 트랜잭션 테스트 실패:', error);
  } finally {
    rl.close();
  }
}

/**
 * 제안 생성 테스트
 */
async function testCreateProposal(daoContract: ethers.Contract, wallet: ethers.Wallet) {
  // 제안 정보 입력 받기
  const description = await question('제안 설명을 입력하세요: ', '테스트 제안입니다');
  
  const durationInput = await question('투표 기간을 초 단위로 입력하세요 (기본값: 3600초): ', '3600');
  const duration = parseInt(durationInput);
  
  const numOptionsInput = await question('투표 옵션 수를 입력하세요 (기본값: 3): ', '3');
  const numOptions = parseInt(numOptionsInput);
  
  // 트랜잭션 전송
  console.log('\n제안 생성 트랜잭션 전송 중...');
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
    
    // 생성된 제안 ID를 반환하여 필요시 다른 테스트에서 사용할 수 있게 함
    return proposalId;
  } else {
    console.warn('\n트랜잭션은 성공했지만 이벤트를 찾을 수 없습니다.');
    return null;
  }
}

/**
 * 제안 종료 테스트
 */
async function testCloseProposal(daoContract: ethers.Contract) {
  const proposalIdInput = await question('종료할 제안 ID를 입력하세요: ');
  const proposalId = parseInt(proposalIdInput);
  
  if (isNaN(proposalId)) {
    throw new Error('유효한 제안 ID를 입력해주세요.');
  }
  
  // 트랜잭션 전송
  console.log(`\n제안 종료 트랜잭션 전송 중...`);
  console.log(`- 제안 ID: ${proposalId}`);
  
  try {
    // 먼저 제안 정보 확인
    const proposal = await daoContract.proposals(proposalId);
    console.log('\n제안 정보:');
    console.log(`- 설명: ${proposal.description}`);
    console.log(`- 상태: ${proposal.closed ? '종료됨' : '진행 중'}`);
    
    if (proposal.closed) {
      console.log('\n⚠️ 이 제안은 이미 종료되었습니다.');
      const forceContinue = await question('그래도 트랜잭션을 보내시겠습니까? (y/n): ', 'n');
      if (forceContinue.toLowerCase() !== 'y') {
        console.log('작업이 취소되었습니다.');
        return;
      }
    }
    
    const tx = await daoContract.closeProposal(proposalId);
    
    console.log(`\n트랜잭션이 전송되었습니다!`);
    console.log(`- 트랜잭션 해시: ${tx.hash}`);
    console.log('- 트랜잭션 확인 대기 중...');
    
    // 트랜잭션 확인 대기
    const receipt = await tx.wait();
    console.log(`\n트랜잭션이 블록체인에 포함되었습니다!`);
    console.log(`- 블록 번호: ${receipt.blockNumber}`);
    console.log(`- 가스 사용량: ${receipt.gasUsed.toString()}`);
    
    // 이벤트에서 제안 ID 추출
    const event = receipt.events?.find((e: any) => e.event === 'ProposalClosed');
    if (event && event.args) {
      console.log(`\n제안이 성공적으로 종료되었습니다!`);
      console.log(`- 제안 ID: ${event.args.proposalId.toNumber()}`);
    } else {
      console.warn('\n트랜잭션은 성공했지만 이벤트를 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error(`\n제안 종료 실패:`, error);
    throw error;
  }
}

/**
 * 투표 테스트
 */
async function testVote(daoContract: ethers.Contract) {
  const proposalIdInput = await question('투표할 제안 ID를 입력하세요: ');
  const proposalId = parseInt(proposalIdInput);
  
  if (isNaN(proposalId)) {
    throw new Error('유효한 제안 ID를 입력해주세요.');
  }
  
  // 제안 정보 확인
  try {
    const proposal = await daoContract.proposals(proposalId);
    console.log('\n제안 정보:');
    console.log(`- 설명: ${proposal.description}`);
    console.log(`- 상태: ${proposal.closed ? '종료됨' : '진행 중'}`);
    console.log(`- 옵션 수: ${proposal.optionCount.toNumber()}`);
    
    if (proposal.closed) {
      console.log('\n⚠️ 이 제안은 이미 종료되었습니다. 투표할 수 없습니다.');
      return;
    }
    
    const optionCountNumber = proposal.optionCount.toNumber();
    console.log(`\n사용 가능한 옵션: 0부터 ${optionCountNumber - 1}까지`);
    
    const optionInput = await question(`투표할 옵션 번호를 입력하세요 (0-${optionCountNumber - 1}): `, '0');
    const option = parseInt(optionInput);
    
    if (isNaN(option) || option < 0 || option >= optionCountNumber) {
      throw new Error(`유효한 옵션 번호를 입력해주세요 (0-${optionCountNumber - 1}).`);
    }
    
    // 트랜잭션 전송
    console.log(`\n투표 트랜잭션 전송 중...`);
    console.log(`- 제안 ID: ${proposalId}`);
    console.log(`- 선택 옵션: ${option}`);
    
    const tx = await daoContract.vote(proposalId, option);
    
    console.log(`\n트랜잭션이 전송되었습니다!`);
    console.log(`- 트랜잭션 해시: ${tx.hash}`);
    console.log('- 트랜잭션 확인 대기 중...');
    
    // 트랜잭션 확인 대기
    const receipt = await tx.wait();
    console.log(`\n트랜잭션이 블록체인에 포함되었습니다!`);
    console.log(`- 블록 번호: ${receipt.blockNumber}`);
    console.log(`- 가스 사용량: ${receipt.gasUsed.toString()}`);
    
    // 이벤트에서 투표 정보 추출
    const event = receipt.events?.find((e: any) => e.event === 'Voted');
    if (event && event.args) {
      console.log(`\n투표가 성공적으로 완료되었습니다!`);
      console.log(`- 제안 ID: ${event.args.proposalId.toNumber()}`);
      console.log(`- 투표자: ${event.args.voter}`);
      console.log(`- 선택 옵션: ${event.args.option.toString()}`);
    } else {
      console.warn('\n트랜잭션은 성공했지만 이벤트를 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error(`\n투표 실패:`, error);
    throw error;
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