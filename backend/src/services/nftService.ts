import { ethers } from 'ethers';
import GameNFTABI from '../utils/abis/GameItem.json';
import { prisma } from '../utils/prisma-manager';
import { uploadMetadata } from '../utils/ipfsService';

// 프로바이더 및 컨트랙트 설정
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');
const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS || '';
const privateKey = process.env.CONTRACT_PRIVATE_KEY || '';

// 프라이빗 키가 있는 경우에만 월렛과 컨트랙트 초기화
let wallet: ethers.Wallet | undefined;
let nftContract: ethers.Contract | undefined;

if (privateKey && privateKey.length > 0 && NFT_CONTRACT_ADDRESS) {
  wallet = new ethers.Wallet(privateKey, provider);
  nftContract = new ethers.Contract(
    NFT_CONTRACT_ADDRESS,
    GameNFTABI,
    wallet
  );
} else {
  console.warn('환경 변수에 CONTRACT_PRIVATE_KEY 또는 NFT_CONTRACT_ADDRESS가 설정되지 않았습니다. NFT 기능이 비활성화됩니다.');
}

// NFT 민팅 대기열 처리 함수
export async function processMintQueue() {
  try {
    if (!nftContract) {
      console.warn('NFT 컨트랙트가 초기화되지 않았습니다. 민팅 처리를 건너뜁니다.');
      return;
    }
    
    // 처리되지 않은 민팅 요청 조회
    const pendingMints = await prisma.$queryRaw`
      SELECT m.*, u.* FROM "MintQueue" m
      JOIN "User" u ON m."userId" = u.id
      WHERE m."processed" = false
      LIMIT 10
    ` as any[];
    
    console.log(`${pendingMints.length}개의 민팅 대기 항목 처리 시작`);
    
    for (const mintRequest of pendingMints) {
      try {
        // 트랜잭션 생성 및 전송
        const tx = await nftContract.mintNFT(
          mintRequest.walletAddress,
          mintRequest.metadataURI,
          mintRequest.mintType
        );
        
        console.log(`민팅 트랜잭션 전송: ${tx.hash}`);
        
        // 트랜잭션 완료 대기
        const receipt = await tx.wait();
        
        // 이벤트에서 토큰 ID 추출
        const mintEvent = receipt.events?.find((e: any) => e.event === 'NFTMinted');
        const tokenId = mintEvent?.args?.tokenId.toString();
        
        if (!tokenId) {
          throw new Error('민팅 이벤트에서 토큰 ID를 추출할 수 없습니다');
        }
        
        // PlayerNFT 레코드 생성
        await prisma.$executeRaw`
          INSERT INTO "PlayerNFT" 
          ("userId", "nftTokenId", "tokenURI", "mintType", "txHash", "confirmed", "sessionId", "questId", "name", "description", "image", "attributes")
          VALUES (
            ${mintRequest.userId}, 
            ${tokenId}, 
            ${mintRequest.metadataURI}, 
            ${mintRequest.mintType}, 
            ${tx.hash}, 
            ${true}, 
            ${mintRequest.sessionId}, 
            ${mintRequest.questId}, 
            ${"Game Item #" + tokenId}, 
            ${"An item from the TRPG game"}, 
            ${"https://example.com/image.png"}, 
            ${{}}::jsonb
          )
        `;
        
        // 민팅 대기열 항목 업데이트
        await prisma.$executeRaw`
          UPDATE "MintQueue"
          SET "processed" = true, "processedAt" = ${new Date()}
          WHERE "id" = ${mintRequest.id}
        `;
        
        console.log(`NFT 민팅 완료: 유저 ${mintRequest.userId}, 토큰 ID ${tokenId}`);
      } catch (error) {
        console.error(`민팅 처리 오류:`, error);
      }
    }
  } catch (error) {
    console.error('민팅 대기열 처리 중 오류:', error);
  }
}

// NFT 민팅 요청 생성 함수
export async function queueNFTMint(
  userId: number,
  walletAddress: string,
  metadata: any,
  mintType: string,
  sessionId?: number,
  questId?: number
) {
  try {
    // IPFS에 메타데이터 업로드
    const metadataURI = await uploadMetadata(metadata);
    
    // 민팅 대기열에 추가
    const result = await prisma.$queryRaw`
      INSERT INTO "MintQueue" 
      ("userId", "walletAddress", "metadataURI", "mintType", "sessionId", "questId", "createdAt")
      VALUES (
        ${userId}, 
        ${walletAddress}, 
        ${metadataURI}, 
        ${mintType}, 
        ${sessionId}, 
        ${questId}, 
        ${new Date()}
      )
      RETURNING *
    ` as any[];
    
    const mintRequest = result[0];
    
    console.log(`NFT 민팅 요청이 대기열에 추가됨: ID ${mintRequest.id}`);
    return mintRequest;
  } catch (error) {
    console.error('NFT 민팅 요청 생성 중 오류:', error);
    throw error;
  }
}

// NFT 이벤트 리스너 설정
export function setupNFTEventListeners() {
  if (!nftContract) {
    console.warn('NFT 컨트랙트가 초기화되지 않았습니다. 이벤트 리스너를 설정할 수 없습니다.');
    return;
  }
  
  nftContract.on('NFTMinted', async (player: string, tokenId: string, tokenURI: string, eventType: string) => {
    try {
      console.log(`NFT 민팅 이벤트 수신: 플레이어 ${player}, 토큰 ID ${tokenId}`);
      
      // 필요시 추가 처리
      // 예: 게임 내 알림, 보상 지급 등
    } catch (error) {
      console.error('NFT 이벤트 처리 오류:', error);
    }
  });
}

// 주기적인 민팅 대기열 처리 스케줄링
export function startNFTProcessingSchedule() {
  setInterval(processMintQueue, 5 * 60 * 1000); // 5분마다 실행
  processMintQueue(); // 초기 실행
}
