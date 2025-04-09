import express from 'express';
import { queueNFTMint } from '../services/nftService';
import { authenticateUser } from '../middleware/auth';
import { prisma } from '../utils/prisma-manager';
import { ethers } from 'ethers';

// 트랜잭션 파이프라인 관련 타입 정의 추가
type TransactionStep = 'initialization' | 'providerSetup' | 'networkCheck' | 'contractSetup' | 'gasEstimation' | 'nonceSetup' | 'transaction' | 'confirmation';
type TransactionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ERROR' | 'RETRY';

interface StepInfo {
  status: TransactionStatus;
  startTime?: string;
  endTime?: string;
  message?: string;
  [key: string]: any;
}

interface TransactionPipeline {
  requestId: string;
  status: 'PENDING' | 'SUBMITTED' | 'CONFIRMED' | 'ERROR';
  createdAt: string;
  steps: {
    [key in TransactionStep]: StepInfo;
  };
  txHash?: string;
  blockExplorerLink?: string;
  result?: any;
  error?: string;
  walletAddress?: string;
  tokenId?: number;
  metadataURI?: string;
  estimatedCompletionTime?: string;
}

// 트랜잭션 처리 상태를 저장하는 Map (실제 운영 환경에서는 Redis나 데이터베이스로 대체해야 함)
const transactionPipelines = new Map<string, TransactionPipeline>();

const router = express.Router();

// RPC 연결 테스트 함수 (공통으로 사용)
const testRpcConnection = async (url: string, timeout = 5000) => {
  try {
    const testProvider = new ethers.providers.JsonRpcProvider(url, 'sepolia');
    testProvider.pollingInterval = 15000; // 폴링 간격 증가
    
    // 짧은 타임아웃으로 기본 호출 테스트
    const connectPromise = testProvider.getBlockNumber();
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('RPC 연결 테스트 타임아웃')), timeout)
    );
    
    const blockNumber = await Promise.race([connectPromise, timeoutPromise]);
    console.log(`RPC ${url} 연결 성공, 현재 블록: ${blockNumber}`);
    return { success: true, provider: testProvider };
  } catch (error: any) {
    console.log(`RPC ${url} 연결 실패:`, error.message);
    return { success: false, provider: null };
  }
};

// RPC 공급자 설정 함수 (공통으로 사용)
const setupRpcProvider = async () => {
  const rpcUrl = process.env.RPC_URL;
  console.log('RPC URL 직접 사용:', rpcUrl);
  
  if (!rpcUrl) {
    throw new Error('RPC_URL 환경 변수가 설정되지 않았습니다.');
  }
  
  try {
    // 단일 공급자 직접 생성
    const provider = new ethers.providers.JsonRpcProvider({
      url: rpcUrl,
      timeout: 60000, // 60초 타임아웃 (충분히 길게 설정)
    });
    
    // 네트워크 연결 테스트
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    
    console.log(`RPC 연결 성공 - 네트워크: ${network.name}, 현재 블록: ${blockNumber}`);
    
    // 폴링 간격 설정
    provider.pollingInterval = 15000; // 15초로 설정 (기본값 4초보다 길게)
    
    return provider;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    console.error('RPC 연결 실패:', errorMessage);
    throw new Error(`RPC 연결 실패: ${errorMessage}`);
  }
};

// 트랜잭션 처리를 위한 상수 및 타입 정의
const CONFIRMATION_BLOCKS = 5; // 트랜잭션 확인에 필요한 블록 수

/**
 * @swagger
 * /api/nft/mint:
 *   post:
 *     tags:
 *       - NFT
 *     summary: NFT 민팅 요청을 생성합니다
 *     description: 인증된 사용자가 NFT 민팅을 요청합니다. 민팅은 비동기적으로 처리됩니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - metadata
 *               - mintType
 *             properties:
 *               metadata:
 *                 type: object
 *                 description: NFT 메타데이터
 *               mintType:
 *                 type: string
 *                 description: "민팅 유형 (예: 'quest', 'achievement', 'item')"
 *               sessionId:
 *                 type: integer
 *                 description: 관련 게임 세션 ID (선택 사항)
 *               questId:
 *                 type: integer
 *                 description: 관련 퀘스트 ID (선택 사항)
 *     responses:
 *       201:
 *         description: 민팅 요청이 성공적으로 큐에 추가됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: NFT 민팅 요청이 성공적으로 큐에 추가되었습니다
 *                 requestId:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: 잘못된 요청 파라미터
 *       401:
 *         description: 인증되지 않은 사용자
 *       500:
 *         description: 서버 오류
 */
router.post('/mint', async (req, res) => {
  try {
    const { metadata, mintType, sessionId, questId } = req.body;
    
    // authenticateUser 미들웨어는 req.user를 설정하므로, 타입 단언 사용
    const user = req.user as { userId: number; walletAddress: string };
    const userId = user.userId;
    const walletAddress = user.walletAddress;
    
    if (!metadata || !mintType) {
      return res.status(400).json({ error: '메타데이터와 민팅 타입은 필수입니다.' });
    }
    
    const mintRequest = await queueNFTMint(
      userId,
      walletAddress,
      metadata,
      mintType,
      sessionId,
      questId
    );
    
    res.status(201).json({
      message: 'NFT 민팅 요청이 성공적으로 큐에 추가되었습니다',
      requestId: mintRequest.id
    });
  } catch (error) {
    console.error('NFT 민팅 요청 처리 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/nft/user/{userId}:
 *   get:
 *     tags:
 *       - NFT
 *     summary: 유저의 NFT 목록을 조회합니다
 *     description: 특정 유저가 소유한 모든 NFT 목록을 조회합니다
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 유저 ID
 *     responses:
 *       200:
 *         description: 성공적으로 NFT 목록 조회
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   userId:
 *                     type: integer
 *                   nftTokenId:
 *                     type: string
 *                   tokenURI:
 *                     type: string
 *                   mintType:
 *                     type: string
 *                   txHash:
 *                     type: string
 *                   mintedAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: 서버 오류
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Prisma Raw Query로 변경하여 타입 문제 해결
    const nfts = await prisma.$queryRaw`
      SELECT * FROM "PlayerNFT" 
      WHERE "userId" = ${userId}
      ORDER BY "mintedAt" DESC
    `;
    
    res.json(nfts);
  } catch (error) {
    console.error('NFT 목록 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/nft/session/{sessionId}:
 *   get:
 *     tags:
 *       - NFT
 *     summary: 특정 세션의 NFT 목록을 조회합니다
 *     description: 게임 세션 중 생성된 모든 NFT 목록을 조회합니다
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 세션 ID
 *     responses:
 *       200:
 *         description: 성공적으로 세션 NFT 목록 조회
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   userId:
 *                     type: integer
 *                   sessionId:
 *                     type: integer
 *                   nftTokenId:
 *                     type: string
 *                   user:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       username:
 *                         type: string
 *       500:
 *         description: 서버 오류
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    
    // Prisma Raw Query로 변경하여 타입 문제 해결
    const nfts = await prisma.$queryRaw`
      SELECT p.*, u.* FROM "PlayerNFT" p
      JOIN "User" u ON p."userId" = u.id
      WHERE p."sessionId" = ${sessionId}
      ORDER BY p."mintedAt" DESC
    ` as any[]; // SQL 결과에 타입 단언 추가
    
    // 결과를 클라이언트 친화적인 형식으로 변환
    const formattedNfts = nfts.map((nft: any) => {
      // 사용자 정보와 NFT 정보 분리
      const { id, walletAddress, createdAt, ...userRest } = nft;
      return {
        id: nft.id,
        userId: nft.userId,
        nftTokenId: nft.nftTokenId,
        tokenURI: nft.tokenURI,
        mintType: nft.mintType,
        txHash: nft.txHash,
        mintedAt: nft.mintedAt,
        sessionId: nft.sessionId,
        questId: nft.questId,
        user: {
          id: nft.userId,
          walletAddress: nft.walletAddress,
          // 기타 필요한 사용자 정보
        }
      };
    });
    
    res.json(formattedNfts);
  } catch (error) {
    console.error('세션 NFT 목록 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/nft/mintByID:
 *   post:
 *     tags:
 *       - NFT
 *     summary: 특정 토큰 ID로 직접 NFT를 민팅합니다 (관리자 전용)
 *     description: 관리자가 특정 지갑 주소로 지정된 토큰 ID의 NFT를 즉시 민팅합니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *               - tokenId
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 description: NFT를 받을 지갑 주소
 *               tokenId:
 *                 type: integer
 *                 description: 민팅할 NFT 토큰 ID (0-90 사이의 값)
 *               metadataURI:
 *                 type: string
 *                 description: 커스텀 메타데이터 URI (선택 사항)
 *     responses:
 *       200:
 *         description: NFT가 성공적으로 민팅됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: NFT가 성공적으로 민팅되었습니다
 *                 txHash:
 *                   type: string
 *                   example: 0x1234...
 *                 tokenId:
 *                   type: string
 *                   example: 42
 *       400:
 *         description: 잘못된 요청 파라미터
 *       401:
 *         description: 인증되지 않은 사용자
 *       403:
 *         description: 권한 없음 (관리자만 사용 가능)
 *       500:
 *         description: 서버 오류
 */
router.post('/mintByID', async (req, res) => {
  console.time('전체 민팅 과정');
  try {
    console.time('요청 파라미터 처리');
    const { walletAddress, tokenId, metadataURI } = req.body;
    
    // 테스트를 위해 인증 체크 임시 제거
    // const user = req.user as { userId: number; walletAddress: string; isAdmin?: boolean };
    // if (!user.isAdmin) {
    //   return res.status(403).json({ error: '관리자만 이 기능을 사용할 수 있습니다' });
    // }
    
    // 필수 파라미터 확인
    if (!walletAddress || tokenId === undefined) {
      console.timeEnd('요청 파라미터 처리');
      console.timeEnd('전체 민팅 과정');
      return res.status(400).json({ error: '지갑 주소와 토큰 ID는 필수입니다' });
    }
    
    // 토큰 ID 범위 확인 (0-92로 수정)
    if (tokenId < 0 || tokenId > 92) {
      console.timeEnd('요청 파라미터 처리');
      console.timeEnd('전체 민팅 과정');
      return res.status(400).json({ error: '토큰 ID는 0에서 92 사이여야 합니다' });
    }
    console.timeEnd('요청 파라미터 처리');
    
    console.time('환경 변수 및 라이브러리 로드');
    // nftService에서 ethers, nftContract 가져오기
    const GameNFTABI = require('../utils/abis/GameItem.json');
    
    // 환경 변수 로드
    const provider = await setupRpcProvider(); // 공통 함수 사용
    const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS || '';
    const privateKey = process.env.CONTRACT_PRIVATE_KEY || '';
    
    if (!privateKey || !NFT_CONTRACT_ADDRESS) {
      console.timeEnd('환경 변수 및 라이브러리 로드');
      console.timeEnd('전체 민팅 과정');
      return res.status(500).json({ error: '컨트랙트 설정이 올바르지 않습니다' });
    }
    console.timeEnd('환경 변수 및 라이브러리 로드');
    
    console.time('블록체인 네트워크 상태 확인');
    try {
      // 네트워크 상태 확인 로그 추가
      const gasPrice = await provider.getGasPrice();
      const gasPriceInGwei = ethers.utils.formatUnits(gasPrice, 'gwei');
      console.log(`가스 가격: ${gasPriceInGwei} gwei`);
    } catch (networkStatusError) {
      console.log('가스 가격 확인 중 오류 발생:', networkStatusError);
    }
    console.timeEnd('블록체인 네트워크 상태 확인');
    
    console.time('컨트랙트 연결');
    // 컨트랙트 연결
    const wallet = new ethers.Wallet(privateKey, provider);
    const nftContract = new ethers.Contract(
      NFT_CONTRACT_ADDRESS,
      GameNFTABI,
      wallet
    );
    console.log(`컨트랙트 주소: ${NFT_CONTRACT_ADDRESS}`);
    console.log(`지갑 주소: ${wallet.address}`);
    console.timeEnd('컨트랙트 연결');
    
    console.time('트랜잭션 전송');
    // 민팅 트랜잭션 전송
    const gasLimit = 500000;
    console.log(`트랜잭션 준비 - 수신자: ${walletAddress}, 토큰ID: ${tokenId}, 가스 한도: ${gasLimit}`);
    
    const tx = await nftContract.mintByID(
      walletAddress,
      tokenId,
      { gasLimit }
    );
    
    console.log(`민팅 트랜잭션 전송 완료: ${tx.hash} (토큰 ID: ${tokenId})`);
    console.timeEnd('트랜잭션 전송');
    
    console.time('트랜잭션 확인 대기');
    console.log(`트랜잭션 확인 대기 시작: ${new Date().toISOString()}`);
    // 트랜잭션 완료 대기
    const receipt = await tx.wait();
    console.log(`트랜잭션 확인 완료: ${new Date().toISOString()}, 블록: ${receipt.blockNumber}, 가스 사용량: ${receipt.gasUsed.toString()}`);
    console.timeEnd('트랜잭션 확인 대기');
    
    console.time('이벤트 처리 및 응답');
    // 이벤트에서 토큰 ID 추출
    const receiptWithEvents = receipt as unknown as { events?: Array<{ event: string; args?: any }> };
    const mintEvent = receiptWithEvents.events?.find(e => e.event === 'minted');
    const confirmedTokenId = mintEvent?.args?.tokenId.toString();
    
    if (!confirmedTokenId) {
      console.timeEnd('이벤트 처리 및 응답');
      throw new Error('민팅 이벤트에서 토큰 ID를 추출할 수 없습니다');
    }
    
    // PlayerNFT 레코드 생성
    const nftRecord = {
      nftTokenId: confirmedTokenId,
      txHash: tx.hash,
      confirmed: true,
      tokenURI: metadataURI || '',
      name: `Game Item #${confirmedTokenId}`,
      description: 'Direct minted TRPG game item',
      image: metadataURI ? 'https://example.com/image.png' : ''
    };
    
    // 커스텀 URI 설정이 필요한 경우
    if (metadataURI) {
      await nftContract.setCustomURI(confirmedTokenId, metadataURI);
      console.log(`토큰 ${confirmedTokenId}의 커스텀 URI가 설정되었습니다: ${metadataURI}`);
    }
    
    console.timeEnd('이벤트 처리 및 응답');
    console.timeEnd('전체 민팅 과정');
    
    res.status(200).json({
      message: 'NFT가 성공적으로 민팅되었습니다',
      txHash: tx.hash,
      tokenId: confirmedTokenId,
      nft: nftRecord
    });
    
  } catch (error) {
    console.error('NFT 민팅 오류:', error);
    console.timeEnd('전체 민팅 과정');
    if (error instanceof Error) {
      res.status(500).json({ error: '민팅 중 오류가 발생했습니다: ' + error.message });
    } else {
      res.status(500).json({ error: '민팅 중 알 수 없는 오류가 발생했습니다' });
    }
  }
});

/**
 * @swagger
 * /api/nft/mintByIDAsync:
 *   post:
 *     tags:
 *       - NFT
 *     summary: 특정 토큰 ID로 직접 NFT를 비동기적으로 민팅합니다
 *     description: 관리자가 특정 지갑 주소로 지정된 토큰 ID의 NFT를 비동기적으로 민팅합니다. 트랜잭션 확인을 기다리지 않고 즉시 응답합니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *               - tokenId
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 description: NFT를 받을 지갑 주소
 *               tokenId:
 *                 type: integer
 *                 description: 민팅할 NFT 토큰 ID (0-92 사이의 값)
 *               metadataURI:
 *                 type: string
 *                 description: 커스텀 메타데이터 URI (선택 사항)
 *     responses:
 *       202:
 *         description: NFT 민팅 트랜잭션이 전송됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: NFT 민팅 트랜잭션이 전송되었습니다
 *                 txHash:
 *                   type: string
 *                   example: 0x1234...
 *                 tokenId:
 *                   type: string
 *                   example: 42
 *       400:
 *         description: 잘못된 요청 파라미터
 *       401:
 *         description: 인증되지 않은 사용자
 *       403:
 *         description: 권한 없음 (관리자만 사용 가능)
 *       500:
 *         description: 서버 오류
 */
router.post('/mintByIDAsync', async (req, res) => {
  console.time('비동기 민팅 요청 처리');
  
  // 요청 ID 생성 (트래킹용)
  const requestId = `mint-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  console.log(`[${requestId}] 비동기 민팅 요청 시작`);
  
  try {
    console.time('요청 파라미터 처리');
    const { walletAddress, tokenId, metadataURI } = req.body;
    
    // 필수 파라미터 확인
    if (!walletAddress || tokenId === undefined) {
      console.timeEnd('요청 파라미터 처리');
      console.timeEnd('비동기 민팅 요청 처리');
      return res.status(400).json({ error: '지갑 주소와 토큰 ID는 필수입니다' });
    }
    
    // 토큰 ID 범위 확인 (0-92로 수정)
    if (tokenId < 0 || tokenId > 92) {
      console.timeEnd('요청 파라미터 처리');
      console.timeEnd('비동기 민팅 요청 처리');
      return res.status(400).json({ error: '토큰 ID는 0에서 92 사이여야 합니다' });
    }
    console.timeEnd('요청 파라미터 처리');
    
    // 트랜잭션 파이프라인 생성 - 사용자 경험 개선을 위한 단계적 상태 추적
    const txPipeline: TransactionPipeline = {
      requestId,
      status: 'PENDING', // PENDING, SUBMITTED, CONFIRMED, ERROR
      createdAt: new Date().toISOString(),
      walletAddress,
      tokenId,
      metadataURI: metadataURI || '',
      steps: {
        initialization: { status: 'PENDING' },
        providerSetup: { status: 'PENDING' },
        networkCheck: { status: 'PENDING' },
        contractSetup: { status: 'PENDING' },
        gasEstimation: { status: 'PENDING' },
        nonceSetup: { status: 'PENDING' },
        transaction: { status: 'PENDING', attempts: 0, maxAttempts: 3 },
        confirmation: { status: 'PENDING' }
      }
    };
    
    // 트랜잭션 파이프라인 상태 저장
    transactionPipelines.set(requestId, txPipeline);
    
    // 즉시 응답 반환 (트랜잭션 처리는 백그라운드에서 계속)
    res.status(202).json({
      message: 'NFT 민팅 요청이 접수되었습니다.',
      status: 'PENDING',
      requestId: requestId,
      walletAddress,
      tokenId,
      // 사용자 경험 개선을 위한 추가 정보
      estimatedTime: '2-5분', // 예상 소요 시간
      statusCheckEndpoint: `/api/nft/status/${requestId}`, // 상태 확인 엔드포인트
      steps: [
        { name: '요청 접수', status: 'COMPLETED' },
        { name: '환경 설정', status: 'PENDING' },
        { name: '네트워크 연결', status: 'PENDING' },
        { name: '트랜잭션 전송', status: 'PENDING' },
        { name: '블록체인 확인', status: 'PENDING' }
      ]
    });
    
    // 여기부터는 클라이언트 응답과 무관하게 백그라운드에서 처리됨
    console.log(`[${requestId}] 클라이언트에 응답 전송 완료, 백그라운드 처리 시작`);
    
    // 상태 업데이트 함수 - 웹소켓이나 이벤트 시스템으로 대체 가능
    const updateStatus = async (
      step: TransactionStep, 
      status: TransactionStatus, 
      data: Record<string, any> = {}
    ) => {
      const pipeline = transactionPipelines.get(requestId);
      if (!pipeline) return;
      
      pipeline.steps[step].status = status;
      
      if (status === 'IN_PROGRESS') {
        pipeline.steps[step].startTime = new Date().toISOString();
      } else if (status === 'COMPLETED' || status === 'ERROR') {
        pipeline.steps[step].endTime = new Date().toISOString();
      }
      
      // 추가 데이터 병합
      Object.assign(pipeline.steps[step], data);
      
      // 전체 상태 업데이트
      if (step === 'transaction' && status === 'COMPLETED' && data.hash) {
        pipeline.status = 'SUBMITTED';
        pipeline.txHash = data.hash;
        pipeline.blockExplorerLink = `https://sepolia.etherscan.io/tx/${data.hash}`;
      } else if (step === 'confirmation' && status === 'COMPLETED') {
        pipeline.status = 'CONFIRMED';
        pipeline.result = data;
      } else if (status === 'ERROR') {
        pipeline.status = 'ERROR';
        pipeline.error = data.error || '알 수 없는 오류';
      }
      
      // 상태 저장 (실제 구현에서는 DB나 Redis에 저장)
      transactionPipelines.set(requestId, pipeline);
      
      console.log(`[${requestId}] 상태 업데이트: ${step} => ${status}`);
    };
    
    // RPC 설정 및 컨트랙트 연결을 비동기적으로 진행
    const processMinting = async () => {
      try {
        // 초기화 단계
        await updateStatus('initialization', 'IN_PROGRESS');
        console.time(`[${requestId}] 환경 변수 및 라이브러리 로드`);
        const GameNFTABI = require('../utils/abis/GameItem.json');
        
        // 환경 변수 로드
        const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS || '';
        const privateKey = process.env.CONTRACT_PRIVATE_KEY || '';
        
        if (!privateKey || !NFT_CONTRACT_ADDRESS) {
          await updateStatus('initialization', 'ERROR', { error: '컨트랙트 설정이 올바르지 않습니다' });
          throw new Error('컨트랙트 설정이 올바르지 않습니다');
        }
        console.timeEnd(`[${requestId}] 환경 변수 및 라이브러리 로드`);
        await updateStatus('initialization', 'COMPLETED');
        
        // RPC 공급자 설정
        await updateStatus('providerSetup', 'IN_PROGRESS');
        console.time(`[${requestId}] RPC 공급자 설정`);
        let provider;
        try {
          provider = await setupRpcProvider();
          console.timeEnd(`[${requestId}] RPC 공급자 설정`);
          await updateStatus('providerSetup', 'COMPLETED');
        } catch (providerError) {
          console.timeEnd(`[${requestId}] RPC 공급자 설정`);
          const errorMessage = providerError instanceof Error ? providerError.message : '알 수 없는 오류';
          await updateStatus('providerSetup', 'ERROR', { error: errorMessage });
          throw new Error(`RPC 공급자 설정 실패: ${errorMessage}`);
        }
        
        // 네트워크 확인
        await updateStatus('networkCheck', 'IN_PROGRESS');
        console.time(`[${requestId}] 네트워크 확인`);
        try {
          const network = await provider.getNetwork();
          const blockNumber = await provider.getBlockNumber();
          const gasPrice = await provider.getGasPrice();
          const gasPriceInGwei = ethers.utils.formatUnits(gasPrice, 'gwei');
          console.log(`[${requestId}] 네트워크 확인 완료 - 네트워크: ${network.name}, 현재 블록: ${blockNumber}, 가스 가격: ${gasPriceInGwei} gwei`);
          await updateStatus('networkCheck', 'COMPLETED', { 
            network: network.name, 
            blockNumber, 
            gasPrice: gasPriceInGwei
          });
          console.timeEnd(`[${requestId}] 네트워크 확인`);
        } catch (networkError) {
          console.timeEnd(`[${requestId}] 네트워크 확인`);
          const errorMessage = networkError instanceof Error ? networkError.message : '알 수 없는 오류';
          await updateStatus('networkCheck', 'ERROR', { error: errorMessage });
          throw new Error(`네트워크 연결 실패: ${errorMessage}`);
        }
        
        // 컨트랙트 연결
        await updateStatus('contractSetup', 'IN_PROGRESS');
        console.time(`[${requestId}] 컨트랙트 연결`);
        const wallet = new ethers.Wallet(privateKey, provider);
        const nftContract = new ethers.Contract(
          NFT_CONTRACT_ADDRESS,
          GameNFTABI,
          wallet
        );
        console.log(`[${requestId}] 컨트랙트 주소: ${NFT_CONTRACT_ADDRESS}`);
        console.log(`[${requestId}] 지갑 주소: ${wallet.address}`);
        console.timeEnd(`[${requestId}] 컨트랙트 연결`);
        await updateStatus('contractSetup', 'COMPLETED', {
          contractAddress: NFT_CONTRACT_ADDRESS,
          walletAddress: wallet.address
        });
        
        // 트랜잭션 옵션 설정
        const options: {
          gasLimit: number;
          maxFeePerGas?: ethers.BigNumber;
          maxPriorityFeePerGas?: ethers.BigNumber;
          gasPrice?: ethers.BigNumber;
          nonce?: number;
        } = {
          gasLimit: 500000,
        };
        
        // 가스 가격 설정
        await updateStatus('gasEstimation', 'IN_PROGRESS');
        console.time(`[${requestId}] 가스 가격 설정`);
        try {
          const feeData = await provider.getFeeData();
          if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
            // EIP-1559 지원 네트워크
            const maxFeePerGas = feeData.maxFeePerGas;
            const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
            
            options.maxFeePerGas = maxFeePerGas.mul(120).div(100); // +20% 버퍼
            options.maxPriorityFeePerGas = maxPriorityFeePerGas.mul(110).div(100); // +10% 버퍼
            console.log(`[${requestId}] EIP-1559 가스 가격 설정: maxFeePerGas=${ethers.utils.formatUnits(options.maxFeePerGas, 'gwei')} gwei, maxPriorityFeePerGas=${ethers.utils.formatUnits(options.maxPriorityFeePerGas, 'gwei')} gwei`);
            await updateStatus('gasEstimation', 'COMPLETED', {
              maxFeePerGas: ethers.utils.formatUnits(options.maxFeePerGas, 'gwei'),
              maxPriorityFeePerGas: ethers.utils.formatUnits(options.maxPriorityFeePerGas, 'gwei'),
              type: 'EIP-1559'
            });
          } else if (feeData.gasPrice) {
            // 레거시 가스 가격
            options.gasPrice = feeData.gasPrice;
            console.log(`[${requestId}] 레거시 가스 가격 설정: ${ethers.utils.formatUnits(options.gasPrice, 'gwei')} gwei`);
            await updateStatus('gasEstimation', 'COMPLETED', {
              gasPrice: ethers.utils.formatUnits(options.gasPrice, 'gwei'),
              type: 'LEGACY'
            });
          }
        } catch (feeError) {
          const errorMessage = feeError instanceof Error ? feeError.message : '알 수 없는 오류';
          console.warn(`[${requestId}] 가스 가격 최적화 실패 (기본값 사용):`, errorMessage);
          await updateStatus('gasEstimation', 'COMPLETED', {
            warning: '가스 가격 최적화 실패, 기본값 사용',
            type: 'DEFAULT'
          });
        }
        console.timeEnd(`[${requestId}] 가스 가격 설정`);
        
        // 논스 설정
        await updateStatus('nonceSetup', 'IN_PROGRESS');
        console.time(`[${requestId}] 논스 설정`);
        try {
          options.nonce = await wallet.getTransactionCount('pending');
          console.log(`[${requestId}] 트랜잭션 논스: ${options.nonce}`);
          await updateStatus('nonceSetup', 'COMPLETED', { nonce: options.nonce });
        } catch (nonceError) {
          const errorMessage = nonceError instanceof Error ? nonceError.message : '알 수 없는 오류';
          console.warn(`[${requestId}] 논스 가져오기 실패 (자동 설정 사용):`, errorMessage);
          await updateStatus('nonceSetup', 'COMPLETED', { warning: '논스 가져오기 실패, 자동 설정 사용' });
        }
        console.timeEnd(`[${requestId}] 논스 설정`);
        
        // 트랜잭션 전송 - 재시도 로직 포함
        await updateStatus('transaction', 'IN_PROGRESS', { attempts: 0, maxAttempts: 3 });
        let attemptCount = 0;
        const maxAttempts = 3;
        let lastError: Error | null = null;
        let tx;
        
        while (attemptCount < maxAttempts) {
          try {
            attemptCount++;
            await updateStatus('transaction', 'IN_PROGRESS', { attempts: attemptCount });
            console.log(`[${requestId}] 민팅 시도 ${attemptCount}/${maxAttempts}`);
            console.time(`[${requestId}] 트랜잭션 전송 시도 ${attemptCount}`);
            
            // 트랜잭션 준비 - 사용자에게 표시될 시각적 단계
            console.log(`[${requestId}] 트랜잭션 준비 - 수신자: ${walletAddress}, 토큰ID: ${tokenId}, 가스 한도: ${options.gasLimit}`);
            
            // 논스가 변경되었을 수 있으므로 각 시도마다 업데이트
            if (attemptCount > 1 && options.nonce !== undefined) {
              options.nonce = await wallet.getTransactionCount('pending');
              console.log(`[${requestId}] 재시도를 위한 새 논스: ${options.nonce}`);
              await updateStatus('transaction', 'IN_PROGRESS', { 
                attempts: attemptCount,
                nonce: options.nonce, 
                message: '재시도 중...' 
              });
            }
            
            // 트랜잭션 제출 시작 시간 기록
            await updateStatus('transaction', 'IN_PROGRESS', { 
              startTime: new Date().toISOString(),
              message: '트랜잭션을 블록체인에 제출 중...' 
            });

            // 트랜잭션 제출 (타임아웃 30초)
            const txPromise = nftContract.mintByID(walletAddress, tokenId, options);
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('타임아웃: 트랜잭션 제출이 30초 이상 소요되고 있습니다')), 30000);
            });

            let tx;
            let hasTimedOut = false;

            try {
              // 둘 중 먼저 완료되는 작업 수행
              tx = await Promise.race([txPromise, timeoutPromise]);
            } catch (timeoutError: unknown) {
              if (timeoutError instanceof Error && timeoutError.message.includes('타임아웃')) {
                console.log(`[${requestId}] 트랜잭션 제출 타임아웃 - 사용자에게 알림 필요, 백그라운드에서 계속 진행`);
                hasTimedOut = true;
                await updateStatus('transaction', 'IN_PROGRESS', { 
                  warning: '트랜잭션 제출이 지연되고 있습니다. 백그라운드에서 계속 진행 중입니다.',
                  estimatedWaitTime: '수 분이 소요될 수 있습니다.'
                });
                
                // 타임아웃 발생 시 백그라운드에서 계속 기다림
                tx = await txPromise;
              } else {
                throw timeoutError; // 다른 오류는 그대로 전파
              }
            }

            // 트랜잭션 해시 업데이트
            const txHash = tx.hash;
            console.log(`[${requestId}] 트랜잭션 제출됨: ${txHash}`);
            await updateStatus('transaction', 'COMPLETED', { 
              txHash,
              blockExplorerLink: `${process.env.BLOCK_EXPLORER_URL}/tx/${txHash}`,
              message: hasTimedOut ? '지연된 트랜잭션이 제출되었습니다.' : '트랜잭션이 성공적으로 제출되었습니다.' 
            });
            
            // 트랜잭션 확인 처리를 백그라운드로 분리
            await updateStatus('confirmation', 'IN_PROGRESS', {
              txHash,
              startTime: new Date().toISOString()
            });
            
            // 블록 확인 진행 상황 업데이트 (15초마다)
            const confirmationUpdater = setInterval(async () => {
              try {
                if (!provider) return;
                
                try {
                  const currentBlock = await provider.getBlockNumber();
                  const pipeline = transactionPipelines.get(requestId);
                  if (!pipeline) return;
                  
                  const startTimeStr = pipeline.steps.confirmation.startTime;
                  const elapsedTimeMs = startTimeStr ? Date.now() - new Date(startTimeStr).getTime() : 0;
                  
                  // 확인 남은 블록 수 계산
                  const receipt = await provider.getTransactionReceipt(txHash);
                  const confirmedBlocks = receipt ? currentBlock - receipt.blockNumber : 0;
                  const remainingBlocks = CONFIRMATION_BLOCKS - confirmedBlocks;
                  
                  await updateStatus('confirmation', 'IN_PROGRESS', {
                    currentBlock,
                    confirmedBlocks: confirmedBlocks > 0 ? confirmedBlocks : 0,
                    remainingBlocks: remainingBlocks > 0 ? remainingBlocks : 0, 
                    progress: Math.min(Math.floor((confirmedBlocks / CONFIRMATION_BLOCKS) * 100), 99),
                    elapsedTime: `${Math.round(elapsedTimeMs / 1000)}초`,
                    message: receipt 
                      ? `트랜잭션이 블록 #${receipt.blockNumber}에 포함됨. ${remainingBlocks}개 블록 확인 남음...`
                      : '블록체인에서 트랜잭션 확인 중...'
                  });
                } catch (error) {
                  console.error(`[${requestId}] 확인 상태 업데이트 오류:`, error);
                }
              } catch (error) {
                console.error(`[${requestId}] 확인 상태 업데이트 오류:`, error);
              }
            }, 15000);
            
            // 실제 트랜잭션 확인 대기
            const receipt = await tx.wait();
            clearInterval(confirmationUpdater); // 타이머 정리
            
            console.log(`[${requestId}] 트랜잭션 확인 완료: 블록=${receipt.blockNumber}, 가스=${receipt.gasUsed.toString()}`);
            
            // 이벤트에서 토큰 ID 추출
            const receiptWithEvents = receipt as unknown as { events?: Array<{ event: string; args?: any }> };
            const mintEvent = receiptWithEvents.events?.find(e => e.event === 'minted');
            const confirmedTokenId = mintEvent?.args?.tokenId.toString() || tokenId.toString();
            
            console.log(`[${requestId}] NFT 민팅 완료: 토큰 ID ${confirmedTokenId}, 트랜잭션 해시 ${tx.hash}`);
            
            await updateStatus('confirmation', 'COMPLETED', {
              blockNumber: receipt.blockNumber,
              gasUsed: receipt.gasUsed.toString(),
              confirmedTokenId,
              blockExplorerLink: `https://sepolia.etherscan.io/tx/${tx.hash}`
            });
            
            // PlayerNFT 레코드 생성
            try {
              // req.user에 대한 안전한 타입 처리
              const userId = req.user && typeof req.user === 'object' && 'userId' in req.user ? 
                (req.user as { userId: number }).userId : null;
              
              await prisma.$executeRaw`
                INSERT INTO "PlayerNFT" 
                ("userId", "nftTokenId", "tokenURI", "mintType", "txHash", "confirmed", "name", "description", "image", "attributes")
                VALUES (
                  ${userId}, 
                  ${confirmedTokenId}, 
                  ${metadataURI || ''}, 
                  ${'DIRECT'}, 
                  ${tx.hash}, 
                  ${true}, 
                  ${"Game Item #" + confirmedTokenId}, 
                  ${"Direct minted TRPG game item"}, 
                  ${"https://example.com/image.png"}, 
                  ${{}}::jsonb
                )
              `;
              console.log(`[${requestId}] PlayerNFT 레코드 생성 성공`);
            } catch (dbError) {
              console.error(`[${requestId}] PlayerNFT 레코드 생성 실패:`, dbError);
            }
            
            // 커스텀 URI 설정이 필요한 경우
            if (metadataURI) {
              try {
                await nftContract.setCustomURI(confirmedTokenId, metadataURI);
                console.log(`[${requestId}] 토큰 ${confirmedTokenId}의 커스텀 URI가 설정되었습니다: ${metadataURI}`);
              } catch (uriError) {
                console.error(`[${requestId}] 커스텀 URI 설정 실패:`, uriError);
              }
            }
          } catch (txError) {
            console.error(`[${requestId}] 트랜잭션 전송 시도 ${attemptCount} 실패:`, txError);
            console.timeEnd(`[${requestId}] 트랜잭션 전송 시도 ${attemptCount}`);
            lastError = txError instanceof Error ? txError : new Error(String(txError));
            
            await updateStatus('transaction', 'IN_PROGRESS', {
              attempts: attemptCount,
              error: lastError.message,
              status: attemptCount < maxAttempts ? 'RETRY' : 'ERROR'
            });
            
            if (attemptCount < maxAttempts) {
              // 재시도 전 지연 (백오프 전략)
              const delayMs = 2000 * Math.pow(2, attemptCount - 1); // 지수 백오프: 2초, 4초, ...
              console.log(`[${requestId}] ${delayMs}ms 후 재시도...`);
              await new Promise(resolve => setTimeout(resolve, delayMs));
            }
          }
        }
        
        if (attemptCount === maxAttempts && lastError) {
          console.error(`[${requestId}] 최대 시도 횟수 도달. 민팅 실패.`);
          await updateStatus('transaction', 'ERROR', { 
            error: lastError.message, 
            attempts: attemptCount,
            maxAttempts: maxAttempts
          });
          throw lastError;
        }
        
        console.log(`[${requestId}] 백그라운드 처리 완료 (확인은 별도 프로세스에서 계속)`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        console.error(`[${requestId}] 백그라운드 처리 중 최종 오류:`, errorMessage);
        
        const pipeline = transactionPipelines.get(requestId);
        if (pipeline) {
          pipeline.status = 'ERROR';
          pipeline.error = errorMessage;
          transactionPipelines.set(requestId, pipeline);
        }
      } finally {
        console.timeEnd('비동기 민팅 요청 처리');
      }
    };
    
    // 비동기 처리 시작 (응답과 무관하게 실행)
    processMinting().catch(error => {
      console.error(`[${requestId}] processMinting 에러:`, error);
    });
    
  } catch (error) {
    console.error(`[${requestId}] NFT 민팅 요청 처리 오류:`, error);
    console.timeEnd('비동기 민팅 요청 처리');
    
    // 이미 응답을 보냈는지 확인
    if (!res.headersSent) {
      if (error instanceof Error) {
        res.status(500).json({ error: '민팅 요청 처리 중 오류가 발생했습니다: ' + error.message });
      } else {
        res.status(500).json({ error: '민팅 요청 처리 중 알 수 없는 오류가 발생했습니다' });
      }
    }
  }
});

/**
 * @swagger
 * /api/nft/status/{requestId}:
 *   get:
 *     tags:
 *       - NFT
 *     summary: NFT 민팅 상태 조회
 *     description: 특정 요청 ID를 사용하여 NFT 민팅 상태를 조회합니다.
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: 민팅 요청 ID
 *     responses:
 *       200:
 *         description: 민팅 상태 조회 성공
 *       404:
 *         description: 민팅 요청을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get('/status/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // 트랜잭션 파이프라인에서 상태 조회
    const txPipeline = transactionPipelines.get(requestId);
    
    if (!txPipeline) {
      // 메모리에 없는 경우 DB에서 조회 (향후 구현)
      // const dbStatus = await prisma.transactionStatus.findUnique({
      //   where: { requestId }
      // });
      //
      // if (dbStatus) {
      //   return res.json({
      //     ...dbStatus,
      //     steps: JSON.parse(dbStatus.steps),
      //   });
      // }
      
      // 테스트 환경에서는 404 대신 임시 모의 데이터 반환
      if (process.env.NODE_ENV === 'development') {
        const mockStatus = createMockStatus(requestId);
        return res.json(mockStatus);
      }
      
      return res.status(404).json({ error: '요청된 트랜잭션을 찾을 수 없습니다.' });
    }
    
    // 클라이언트 친화적인 응답 변환
    const formattedSteps = [
      { name: '요청 접수', status: convertStepStatus(txPipeline.steps.initialization.status) },
      { name: '환경 설정', status: convertStepStatus(txPipeline.steps.providerSetup.status) },
      { name: '네트워크 연결', status: convertStepStatus(txPipeline.steps.networkCheck.status) },
      { name: '스마트 컨트랙트 준비', status: convertStepStatus(txPipeline.steps.contractSetup.status) },
      { name: '가스비 계산', status: convertStepStatus(txPipeline.steps.gasEstimation.status) },
      { name: '트랜잭션 설정', status: convertStepStatus(txPipeline.steps.nonceSetup.status) },
      { name: '트랜잭션 전송', status: convertStepStatus(txPipeline.steps.transaction.status) },
      { name: '블록체인 확인', status: convertStepStatus(txPipeline.steps.confirmation.status) }
    ];
    
    // 클라이언트에 반환할 응답 구성
    const response = {
      requestId: txPipeline.requestId,
      status: txPipeline.status,
      walletAddress: txPipeline.walletAddress,
      tokenId: txPipeline.tokenId,
      createdAt: txPipeline.createdAt,
      txHash: txPipeline.txHash,
      error: txPipeline.error,
      blockExplorerLink: txPipeline.blockExplorerLink,
      steps: formattedSteps,
      statusMessage: getStatusMessage(txPipeline.status),
      lastUpdated: new Date().toISOString(),
      
      // 진행률 계산
      progressPercent: calculateProgressPercent(txPipeline),
      
      // 예상 완료 시간
      estimatedCompletionTime: txPipeline.estimatedCompletionTime || 
        (txPipeline.status === 'PENDING' || txPipeline.status === 'SUBMITTED' ? 
          '약 2-5분 소요 예상' : undefined)
    };
    
    res.json(response);
  } catch (error) {
    console.error('민팅 상태 조회 오류:', error);
    res.status(500).json({ error: '상태 조회 중 오류가 발생했습니다' });
  }
});

// 상태 메시지 변환 함수
function getStatusMessage(status: string): string {
  switch (status) {
    case 'PENDING':
      return '민팅 요청이 처리 대기중입니다';
    case 'SUBMITTED':
      return '트랜잭션이 블록체인에 제출되었으며, 확인을 기다리고 있습니다';
    case 'CONFIRMED':
      return 'NFT 민팅이 성공적으로 완료되었습니다';
    case 'ERROR':
      return '민팅 처리 중 오류가 발생했습니다';
    default:
      return '상태를 확인할 수 없습니다';
  }
}

// 단계 상태 변환 함수
function convertStepStatus(status: TransactionStatus): string {
  switch (status) {
    case 'PENDING':
      return 'WAITING';  // 더 일반적인 용어로 변환
    case 'IN_PROGRESS':
      return 'PROCESSING';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'ERROR':
      return 'FAILED';
    case 'RETRY':
      return 'RETRYING';
    default:
      return 'UNKNOWN';
  }
}

// 진행률 계산 함수
function calculateProgressPercent(pipeline: TransactionPipeline): number {
  const stepWeights: Record<TransactionStep, number> = {
    initialization: 5,
    providerSetup: 10,
    networkCheck: 10, 
    contractSetup: 10,
    gasEstimation: 10,
    nonceSetup: 5,
    transaction: 25,
    confirmation: 25
  };
  
  const stepValues: Record<TransactionStatus, number> = {
    'PENDING': 0,
    'IN_PROGRESS': 0.5,
    'COMPLETED': 1,
    'ERROR': 0,
    'RETRY': 0.3
  };
  
  let totalWeight = 0;
  let completedWeight = 0;
  
  // 각 단계의 가중치와 완료 상태를 고려하여 진행률 계산
  for (const [step, weight] of Object.entries(stepWeights) as [TransactionStep, number][]) {
    totalWeight += weight;
    const stepStatus = pipeline.steps[step].status;
    completedWeight += weight * stepValues[stepStatus];
  }
  
  // 특별 케이스: 전체 상태가 CONFIRMED이면 100% 반환
  if (pipeline.status === 'CONFIRMED') {
    return 100;
  }
  
  // 특별 케이스: 전체 상태가 ERROR이면 진행률 그대로 유지
  if (pipeline.status === 'ERROR') {
    return Math.round((completedWeight / totalWeight) * 100);
  }
  
  return Math.round((completedWeight / totalWeight) * 100);
}

// 테스트용 모의 상태 생성 함수
function createMockStatus(requestId: string) {
  const mockStatuses = ['PENDING', 'SUBMITTED', 'CONFIRMED', 'ERROR'];
  const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];
  
  return {
    requestId,
    status: randomStatus,
    createdAt: new Date(Date.now() - 60000).toISOString(),
    updatedAt: new Date().toISOString(),
    txHash: randomStatus !== 'PENDING' ? 
      '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('') : 
      undefined,
    blockNumber: randomStatus === 'CONFIRMED' ? Math.floor(Math.random() * 1000000) : undefined,
    steps: [
      { name: '요청 접수', status: 'COMPLETED' },
      { name: '환경 설정', status: 'COMPLETED' },
      { name: '네트워크 연결', status: 'COMPLETED' },
      { name: '스마트 컨트랙트 준비', status: randomStatus !== 'PENDING' ? 'COMPLETED' : 'PROCESSING' },
      { name: '가스비 계산', status: randomStatus !== 'PENDING' ? 'COMPLETED' : 'WAITING' },
      { name: '트랜잭션 설정', status: randomStatus !== 'PENDING' ? 'COMPLETED' : 'WAITING' },
      { name: '트랜잭션 전송', status: randomStatus === 'PENDING' ? 'WAITING' : 
                              (randomStatus === 'SUBMITTED' ? 'COMPLETED' : 
                               (randomStatus === 'CONFIRMED' ? 'COMPLETED' : 
                                (randomStatus === 'ERROR' ? 'FAILED' : 'WAITING'))) },
      { name: '블록체인 확인', status: randomStatus === 'CONFIRMED' ? 'COMPLETED' : 
                              (randomStatus === 'SUBMITTED' ? 'PROCESSING' : 'WAITING') }
    ],
    statusMessage: getStatusMessage(randomStatus),
    blockExplorerLink: randomStatus !== 'PENDING' ? 
      `https://sepolia.etherscan.io/tx/0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}` : 
      undefined,
    progressPercent: randomStatus === 'CONFIRMED' ? 100 : 
                     (randomStatus === 'SUBMITTED' ? 75 : 
                      (randomStatus === 'PENDING' ? 20 : 50)),
    estimatedCompletionTime: randomStatus === 'PENDING' || randomStatus === 'SUBMITTED' ? 
      '약 2-5분 소요 예상' : undefined
  };
}

// 비동기 트랜잭션 정리 (메모리 관리를 위해 일정 시간 이후 자동 삭제)
setInterval(() => {
  const now = new Date().getTime();
  const expirationTime = 24 * 60 * 60 * 1000; // 24시간 후 만료
  
  for (const [requestId, pipeline] of transactionPipelines.entries()) {
    const createdTime = new Date(pipeline.createdAt).getTime();
    if (now - createdTime > expirationTime) {
      console.log(`[${requestId}] 만료된 트랜잭션 파이프라인 정리`);
      transactionPipelines.delete(requestId);
    }
  }
}, 60 * 60 * 1000); // 1시간마다 실행

export default router;