import { ethers } from 'ethers';
import GameNFTABI from '../utils/abis/GameItem.json';
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
 * NFT 민팅 테스트 함수
 * NFT 컨트랙트에 테스트 토큰을 민팅하는 트랜잭션을 전송합니다.
 */
async function testNFTMint() {
  try {
    console.log('NFT 민팅 테스트 시작...');
    
    // 환경 변수 확인
    const rpcUrl = process.env.RPC_URL;
    const nftContractAddress = process.env.NFT_CONTRACT_ADDRESS;
    const privateKey = process.env.CONTRACT_PRIVATE_KEY;
    
    if (!rpcUrl) {
      throw new Error('RPC_URL 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
    }
    
    if (!nftContractAddress) {
      throw new Error('NFT_CONTRACT_ADDRESS 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
    }
    
    if (!privateKey) {
      throw new Error('CONTRACT_PRIVATE_KEY 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
    }
    
    console.log('NFT 민팅 준비 중...');
    console.log(`- RPC URL: ${rpcUrl}`);
    console.log(`- NFT 컨트랙트 주소: ${nftContractAddress}`);
    
    // 프로바이더 및 월렛 설정
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const nftContract = new ethers.Contract(
      nftContractAddress,
      GameNFTABI,
      wallet
    );
    
    // 월렛 정보 출력
    console.log(`- 사용 지갑 주소: ${wallet.address}`);
    const balance = await provider.getBalance(wallet.address);
    console.log(`- 지갑 잔액: ${ethers.utils.formatEther(balance)} ETH`);
    
    // 민팅 대상 주소 입력 받기
    const toAddress = await new Promise((resolve) => {
      rl.question('\n토큰을 받을 지갑 주소를 입력하세요 (기본값: 본인 지갑): ', (answer) => {
        resolve(answer || wallet.address);
      });
    }) as string;
    
    // 메타데이터 URI 입력 받기
    const metadataURI = await new Promise((resolve) => {
      rl.question('메타데이터 URI를 입력하세요 (기본값: 테스트 URI): ', (answer) => {
        resolve(answer || 'https://example.com/metadata/test');
      });
    }) as string;
    
    // 민팅 타입 입력 받기
    const mintType = await new Promise((resolve) => {
      rl.question('민팅 타입을 입력하세요 (기본값: TEST): ', (answer) => {
        resolve(answer || 'TEST');
      });
    }) as string;
    
    // 트랜잭션 전송 확인
    const confirmSend = await new Promise((resolve) => {
      rl.question('\n실제로 NFT 민팅 트랜잭션을 전송하시겠습니까? (y/n): ', (answer) => {
        resolve(answer.toLowerCase() === 'y');
      });
    });
    
    if (!confirmSend) {
      console.log('NFT 민팅이 취소되었습니다.');
      rl.close();
      return;
    }
    
    // 트랜잭션 전송
    console.log('\n트랜잭션 전송 중...');
    console.log(`- 수신자 주소: ${toAddress}`);
    console.log(`- 메타데이터 URI: ${metadataURI}`);
    console.log(`- 민팅 타입: ${mintType}`);
    
    // mintNFT 함수 호출을 위한 가스 한도 설정 (선택적)
    const gasLimit = 500000; // 충분한 가스 한도 설정
    
    const tx = await nftContract.mintNFT(
      toAddress,
      metadataURI,
      mintType,
      { gasLimit }
    );
    
    console.log(`\n트랜잭션이 전송되었습니다!`);
    console.log(`- 트랜잭션 해시: ${tx.hash}`);
    console.log('- 트랜잭션 확인 대기 중...');
    
    // 트랜잭션 확인 대기
    const receipt = await tx.wait();
    console.log(`\n트랜잭션이 블록체인에 포함되었습니다!`);
    console.log(`- 블록 번호: ${receipt.blockNumber}`);
    console.log(`- 가스 사용량: ${receipt.gasUsed.toString()}`);
    
    // 이벤트에서 토큰 ID 추출
    const mintEvent = receipt.events?.find((e: any) => e.event === 'NFTMinted');
    if (mintEvent && mintEvent.args) {
      const tokenId = mintEvent.args.tokenId.toString();
      console.log(`\nNFT가 성공적으로 민팅되었습니다!`);
      console.log(`- 토큰 ID: ${tokenId}`);
      console.log(`- 소유자: ${mintEvent.args.player}`);
      console.log(`- 토큰 URI: ${mintEvent.args.tokenURI}`);
    } else {
      console.warn('\n트랜잭션은 성공했지만 이벤트를 찾을 수 없습니다.');
    }
    
    console.log('\n테스트 성공!');
  } catch (error) {
    console.error('NFT 민팅 테스트 실패:', error);
  } finally {
    rl.close();
  }
}

// 테스트 실행
testNFTMint()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('테스트 중 오류 발생:', error);
    process.exit(1);
  }); 