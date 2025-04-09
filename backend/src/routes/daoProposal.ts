import express, { Request, Response } from 'express';
import { ethers } from 'ethers';
import DAOABI from '../utils/abis/DAO.json';
import prisma from '../prismaClient';

const router = express.Router();

// 트랜잭션 파이프라인 관련 타입 정의
type TransactionStep = 'initialization' | 'providerSetup' | 'contractSetup' | 'gasEstimation' | 'nonceSetup' | 'transaction' | 'confirmation';
type TransactionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ERROR' | 'RETRY';

// 트랜잭션 처리 상태를 저장하는 Map (실제 운영 환경에서는 Redis나 데이터베이스로 대체해야 함)
const transactionPipelines = new Map<string, TransactionPipeline>();

// 블록 확인 수
const CONFIRMATION_BLOCKS = 2; // 테스트넷에서는 2개만 기다림

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
  proposalId?: number;
  steps: {
    [key in TransactionStep]: StepInfo;
  };
  result?: any;
  error?: string;
  txHash?: string;
  blockExplorerLink?: string;
  estimatedCompletionTime?: string;
  description?: string; // 트랜잭션에 대한 설명
  option?: any; // 투표 옵션 등의 추가 정보
  duration?: number; // 트랜잭션 처리 예상 시간(초)
}

// Provider 설정
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const DAO_CONTRACT_ADDRESS = process.env.DAO_CONTRACT_ADDRESS || '0x0';
const CONTRACT_PRIVATE_KEY = process.env.CONTRACT_PRIVATE_KEY || '';

// RPC 연결 테스트 함수
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

// RPC 공급자 설정 함수
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

/**
 * @swagger
 * /api/dao/create:
 *   post:
 *     summary: 새 DAO 제안 생성 (별도 경로)
 *     description: 새로운 DAO 제안을 생성합니다. 블록체인에 트랜잭션을 전송합니다.
 *     tags: [DAO]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - duration
 *               - numOptions
 *               - users
 *             properties:
 *               description:
 *                 type: string
 *                 description: 제안 설명
 *               duration:
 *                 type: integer
 *                 description: 제안 기간(초)
 *               numOptions:
 *                 type: integer
 *                 description: 투표 옵션 수
 *               users:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 투표 가능한 사용자 주소 목록
 *     responses:
 *       200:
 *         description: 제안 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 transactionHash:
 *                   type: string
 *                 proposalId:
 *                   type: integer
 *       400:
 *         description: 잘못된 요청 또는 필수 매개변수 누락
 *       500:
 *         description: 서버 오류
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { description, duration, numOptions, users } = req.body;
    
    // 요청 검증
    if (!description || !duration || !numOptions || !users) {
      return res.status(400).json({ error: '필수 정보가 누락되었습니다' });
    }
    
    if (!CONTRACT_PRIVATE_KEY) {
      return res.status(500).json({ error: '컨트랙트 개인키 설정이 누락되었습니다' });
    }
    
    // 트랜잭션 처리를 위한 서명자 생성
    const wallet = new ethers.Wallet(CONTRACT_PRIVATE_KEY, provider);
    const daoContract = new ethers.Contract(
      DAO_CONTRACT_ADDRESS,
      DAOABI,
      wallet
    );
    
    // 트랜잭션 전송
    const tx = await daoContract.createProposal(
      description,
      duration,
      numOptions,
      users
    );
    
    // 트랜잭션 확인 대기
    const receipt = await tx.wait();
    
    // 이벤트에서 proposalId 추출
    const event = receipt.events?.find((e: any) => e.event === 'ProposalCreated');
    const proposalId = event?.args?.proposalId.toNumber();
    
    // 데이터베이스에 제안 저장 (마이그레이션 후 주석 해제)
    /*
    await prisma.dAOProposal.create({
      data: {
        proposalId: proposalId,
        description,
        sessionId: 1, // 세션 ID는 요청에서 받거나 적절히 설정
        voteEndTime: new Date(Date.now() + duration * 1000),
        status: 'ACTIVE',
      }
    });
    */
    
    res.json({
      success: true,
      message: '제안이 성공적으로 생성되었습니다',
      transactionHash: receipt.transactionHash,
      proposalId
    });
  } catch (error) {
    console.error('DAO 제안 생성 오류:', error);
    res.status(500).json({ error: '제안 생성 중 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/dao:
 *   get:
 *     summary: DAO 제안 목록 조회
 *     description: 상태별 필터링이 가능한 DAO 제안 목록을 조회합니다.
 *     tags: [DAO]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, CLOSED, PENDING, ALL]
 *         description: 조회할 제안의 상태 (기본값은 ALL)
 *     responses:
 *       200:
 *         description: 제안 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   description:
 *                     type: string
 *                   status:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   votes:
 *                     type: array
 *       500:
 *         description: 서버 오류
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    
    const whereClause = status && status !== 'ALL' 
      ? { status: status as string } 
      : {};
    
    // 실제 구현 시에는 마이그레이션 후 아래 주석을 해제하세요
    /*
    const proposals = await prisma.dAOProposal.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        votes: {
          select: {
            option: true,
            _count: true
          },
          groupBy: ['option']
        }
      }
    });
    
    res.json(proposals);
    */
    
    // 임시로 빈 배열 반환 (마이그레이션 전)
    res.json([]);
  } catch (error) {
    console.error('DAO 제안 조회 오류:', error);
    res.status(500).json({ error: '제안 조회 중 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/dao/{proposalId}:
 *   get:
 *     summary: 특정 DAO 제안 상세 조회
 *     description: 제안 ID를 이용하여 특정 DAO 제안의 상세 정보를 조회합니다.
 *     tags: [DAO]
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 조회할 제안의 ID
 *     responses:
 *       200:
 *         description: 제안 상세 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 description:
 *                   type: string
 *                 status:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 votes:
 *                   type: array
 *       404:
 *         description: 제안을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get('/:proposalId', async (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params;
    
    // 실제 구현 시에는 마이그레이션 후 아래 주석을 해제하세요
    /*
    const proposal = await prisma.dAOProposal.findUnique({
      where: { proposalId: Number(proposalId) },
      include: {
        votes: true
      }
    });
    
    if (!proposal) {
      return res.status(404).json({ error: '제안을 찾을 수 없습니다' });
    }
    
    res.json(proposal);
    */
    
    // 임시로 빈 객체 반환 (마이그레이션 전)
    res.json({
      id: parseInt(proposalId),
      description: "테스트 제안",
      status: "ACTIVE"
    });
  } catch (error) {
    console.error('DAO 제안 상세 조회 오류:', error);
    res.status(500).json({ error: '제안 상세 조회 중 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/dao:
 *   post:
 *     summary: 새 DAO 제안 생성
 *     description: 새로운 DAO 제안을 생성합니다. 비동기 처리 옵션이 있어 블록체인 트랜잭션 진행 상황을 추적할 수 있습니다.
 *     tags: [DAO]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - duration
 *               - numOptions
 *               - users
 *             properties:
 *               description:
 *                 type: string
 *                 description: 제안 설명
 *               duration:
 *                 type: integer
 *                 description: 제안 기간(초)
 *               numOptions:
 *                 type: integer
 *                 description: 투표 옵션 수
 *               users:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 투표 가능한 사용자 주소 목록
 *               processAsync:
 *                 type: boolean
 *                 description: 비동기 처리 여부 (true인 경우 즉시 응답 반환 후 백그라운드에서 처리)
 *                 default: false
 *     responses:
 *       200:
 *         description: 제안 생성 성공 (동기 처리의 경우)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 transactionHash:
 *                   type: string
 *                 proposalId:
 *                   type: integer
 *       202:
 *         description: 제안 생성 요청 접수됨 (비동기 처리의 경우)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 requestId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 statusCheckEndpoint:
 *                   type: string
 *       400:
 *         description: 잘못된 요청 또는 필수 매개변수 누락
 *       500:
 *         description: 서버 오류
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { description, duration, numOptions, users, processAsync = false } = req.body;
    
    // 요청 검증
    if (!description || !duration || !numOptions || !users) {
      return res.status(400).json({ error: '필수 정보가 누락되었습니다' });
    }
    
    if (!CONTRACT_PRIVATE_KEY) {
      return res.status(500).json({ error: '컨트랙트 개인키 설정이 누락되었습니다' });
    }
    
    // 비동기 처리 요청된 경우
    if (processAsync) {
      // 요청 ID 생성 (트래킹용)
      const requestId = `dao-proposal-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      console.log(`[${requestId}] 비동기 DAO 제안 요청 시작`);
      
      // 트랜잭션 파이프라인 생성
      const txPipeline: TransactionPipeline = {
        requestId,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        description, // 요청에서 받은 실제 description 사용
        option: { 
          numOptions, 
          users 
        }, // req.body에서 가져온 값 사용
        duration, // 요청에서 받은 실제 duration 사용
        steps: {
          initialization: { status: 'PENDING', startTime: undefined, endTime: undefined },
          providerSetup: { status: 'PENDING', startTime: undefined, endTime: undefined },
          contractSetup: { status: 'PENDING', startTime: undefined, endTime: undefined },
          gasEstimation: { status: 'PENDING', startTime: undefined, endTime: undefined },
          nonceSetup: { status: 'PENDING', startTime: undefined, endTime: undefined },
          transaction: { status: 'PENDING', startTime: undefined, endTime: undefined, 
                         hash: undefined, attempts: 0, maxAttempts: 3 },
          confirmation: { status: 'PENDING', startTime: undefined, endTime: undefined, 
                          blockNumber: undefined, gasUsed: undefined }
        },
        result: undefined,
        error: undefined,
        txHash: undefined,
        blockExplorerLink: undefined,
        estimatedCompletionTime: undefined
      };
      
      // 즉시 응답 반환 (트랜잭션 처리는 백그라운드에서 계속)
      res.status(202).json({
        message: 'DAO 제안 생성 요청이 접수되었습니다',
        status: 'PENDING',
        requestId: requestId,
        // 사용자 경험 개선을 위한 추가 정보
        estimatedTime: '1-3분', // 예상 소요 시간
        statusCheckEndpoint: `/api/dao/status/${requestId}`, // 상태 확인 엔드포인트
        steps: [
          { name: '요청 접수', status: 'COMPLETED' },
          { name: '환경 설정', status: 'PENDING' },
          { name: '네트워크 연결', status: 'PENDING' },
          { name: '트랜잭션 전송', status: 'PENDING' },
          { name: '블록체인 확인', status: 'PENDING' }
        ]
      });
      
      // 백그라운드에서 처리 시작
      console.log(`[${requestId}] 클라이언트에 응답 전송 완료, 백그라운드 처리 시작`);
      
      // 상태 업데이트 함수
      const updateStatus = async (
        step: TransactionStep, 
        status: TransactionStatus, 
        data: Record<string, any> = {}
      ) => {
        txPipeline.steps[step].status = status;
        
        if (status === 'IN_PROGRESS') {
          txPipeline.steps[step].startTime = new Date().toISOString();
        } else if (status === 'COMPLETED' || status === 'ERROR') {
          txPipeline.steps[step].endTime = new Date().toISOString();
        }
        
        // 추가 데이터 병합
        Object.assign(txPipeline.steps[step], data);
        
        // 전체 상태 업데이트
        if (step === 'transaction' && status === 'COMPLETED' && data.hash) {
          txPipeline.status = 'SUBMITTED';
          txPipeline.txHash = data.hash;
          txPipeline.blockExplorerLink = `https://sepolia.etherscan.io/tx/${data.hash}`;
        } else if (step === 'confirmation' && status === 'COMPLETED') {
          txPipeline.status = 'CONFIRMED';
          txPipeline.result = data;
        } else if (status === 'ERROR') {
          txPipeline.status = 'ERROR';
          txPipeline.error = data.error || '알 수 없는 오류';
        }
        
        // 여기서 DB 업데이트, 웹소켓 이벤트 발송 등 수행 가능
        console.log(`[${requestId}] 상태 업데이트: ${step} => ${status}`);
        // 실제 구현 시: await prisma.$executeRaw`UPDATE "TransactionStatus" ...`;
      };
      
      // 제안 생성 비동기 처리 함수
      const processProposalCreationAsync = async () => {
        try {
          // 초기화 단계
          await updateStatus('initialization', 'IN_PROGRESS');
          
          if (!CONTRACT_PRIVATE_KEY) {
            await updateStatus('initialization', 'ERROR', { error: '컨트랙트 개인키 설정이 올바르지 않습니다' });
            throw new Error('컨트랙트 개인키 설정이 올바르지 않습니다');
          }
          
          if (!DAO_CONTRACT_ADDRESS || DAO_CONTRACT_ADDRESS === '0x0') {
            await updateStatus('initialization', 'ERROR', { error: 'DAO 컨트랙트 주소 설정이 올바르지 않습니다' });
            throw new Error('DAO 컨트랙트 주소 설정이 올바르지 않습니다');
          }
          
          await updateStatus('initialization', 'COMPLETED');
          
          // RPC 공급자 설정
          await updateStatus('providerSetup', 'IN_PROGRESS');
          let provider;
          try {
            provider = await setupRpcProvider();
            await updateStatus('providerSetup', 'COMPLETED');
          } catch (providerError) {
            const errorMessage = providerError instanceof Error ? providerError.message : '알 수 없는 오류';
            await updateStatus('providerSetup', 'ERROR', { error: errorMessage });
            throw new Error(`RPC 공급자 설정 실패: ${errorMessage}`);
          }
          
          // 컨트랙트 연결
          await updateStatus('contractSetup', 'IN_PROGRESS');
          const wallet = new ethers.Wallet(CONTRACT_PRIVATE_KEY, provider);
          const daoContract = new ethers.Contract(
            DAO_CONTRACT_ADDRESS,
            DAOABI,
            wallet
          );
          await updateStatus('contractSetup', 'COMPLETED', {
            contractAddress: DAO_CONTRACT_ADDRESS,
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
          try {
            const feeData = await provider.getFeeData();
            if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
              // EIP-1559 지원 네트워크
              options.maxFeePerGas = feeData.maxFeePerGas.mul(120).div(100);
              options.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas.mul(110).div(100);
              await updateStatus('gasEstimation', 'COMPLETED', {
                maxFeePerGas: ethers.utils.formatUnits(options.maxFeePerGas, 'gwei'),
                maxPriorityFeePerGas: ethers.utils.formatUnits(options.maxPriorityFeePerGas, 'gwei'),
                type: 'EIP-1559'
              });
            } else if (feeData.gasPrice) {
              // 레거시 가스 가격
              options.gasPrice = feeData.gasPrice;
              await updateStatus('gasEstimation', 'COMPLETED', {
                gasPrice: ethers.utils.formatUnits(options.gasPrice, 'gwei'),
                type: 'LEGACY'
              });
            }
          } catch (feeError) {
            await updateStatus('gasEstimation', 'COMPLETED', {
              warning: '가스 가격 최적화 실패, 기본값 사용',
              type: 'DEFAULT'
            });
          }
          
          // 논스 설정
          await updateStatus('nonceSetup', 'IN_PROGRESS');
          try {
            options.nonce = await wallet.getTransactionCount('pending');
            await updateStatus('nonceSetup', 'COMPLETED', { nonce: options.nonce });
          } catch (nonceError) {
            await updateStatus('nonceSetup', 'COMPLETED', { warning: '논스 가져오기 실패, 자동 설정 사용' });
          }
          
          // 트랜잭션 전송 - 재시도 로직 포함
          await updateStatus('transaction', 'IN_PROGRESS', { attempts: 0, maxAttempts: 3 });
          let attemptCount = 0;
          const maxAttempts = 3;
          let lastError: Error | null = null;
          
          while (attemptCount < maxAttempts) {
            try {
              attemptCount++;
              await updateStatus('transaction', 'IN_PROGRESS', { attempts: attemptCount });
              
              if (attemptCount > 1 && options.nonce !== undefined) {
                options.nonce = await wallet.getTransactionCount('pending');
                await updateStatus('transaction', 'IN_PROGRESS', { 
                  attempts: attemptCount,
                  nonce: options.nonce, 
                  message: '재시도 중...' 
                });
              }
              
              await updateStatus('transaction', 'IN_PROGRESS', { 
                startTime: new Date().toISOString(),
                message: '트랜잭션을 블록체인에 제출 중...' 
              });

              // 트랜잭션 제출 (타임아웃 30초)
              const txPromise = daoContract.createProposal(
                description,
                duration,
                numOptions,
                users,
                options
              );
              
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('타임아웃: 트랜잭션 제출이 30초 이상 소요되고 있습니다')), 30000);
              });

              let tx;
              let hasTimedOut = false;

              try {
                tx = await Promise.race([txPromise, timeoutPromise]);
              } catch (timeoutError: unknown) {
                if (timeoutError instanceof Error && timeoutError.message.includes('타임아웃')) {
                  hasTimedOut = true;
                  await updateStatus('transaction', 'IN_PROGRESS', { 
                    warning: '트랜잭션 제출이 지연되고 있습니다. 백그라운드에서 계속 진행 중입니다.',
                    estimatedWaitTime: '수 분이 소요될 수 있습니다.'
                  });
                  
                  tx = await txPromise;
                } else {
                  throw timeoutError;
                }
              }

              const txHash = tx.hash;
              await updateStatus('transaction', 'COMPLETED', { 
                txHash,
                blockExplorerLink: `${process.env.BLOCK_EXPLORER_URL || 'https://sepolia.etherscan.io'}/tx/${txHash}`,
                message: hasTimedOut ? '지연된 트랜잭션이 제출되었습니다.' : '트랜잭션이 성공적으로 제출되었습니다.' 
              });
              
              await updateStatus('confirmation', 'IN_PROGRESS', {
                txHash,
                startTime: new Date().toISOString()
              });
              
              // 블록 확인 진행 상황 업데이트 (15초마다)
              const confirmationUpdater = setInterval(async () => {
                try {
                  if (!provider) return;
                  
                  const currentBlock = await provider.getBlockNumber();
                  const startTimeStr = txPipeline.steps.confirmation.startTime;
                  const elapsedTimeMs = startTimeStr ? Date.now() - new Date(startTimeStr).getTime() : 0;
                  
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
              }, 15000);
              
              // 실제 트랜잭션 확인 대기
              const receipt = await tx.wait();
              clearInterval(confirmationUpdater);
              
              // 이벤트에서 proposalId 추출
              const event = receipt.events?.find((e: any) => e.event === 'ProposalCreated');
              const proposalId = event?.args?.proposalId.toNumber();
              
              await updateStatus('confirmation', 'COMPLETED', {
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                proposalId,
                blockExplorerLink: `${process.env.BLOCK_EXPLORER_URL || 'https://sepolia.etherscan.io'}/tx/${tx.hash}`
              });
              
              // 데이터베이스에 제안 저장 (마이그레이션 후 주석 해제)
              /*
              await prisma.dAOProposal.create({
                data: {
                  proposalId: proposalId,
                  description,
                  sessionId: 1, // 세션 ID는 요청에서 받거나 적절히 설정
                  voteEndTime: new Date(Date.now() + duration * 1000),
                  status: 'ACTIVE',
                  transactionHash: tx.hash
                }
              });
              */
              
              break; // 성공 시 반복문 종료
            } catch (txError) {
              lastError = txError instanceof Error ? txError : new Error(String(txError));
              
              await updateStatus('transaction', 'IN_PROGRESS', {
                attempts: attemptCount,
                error: lastError.message,
                status: attemptCount < maxAttempts ? 'RETRY' : 'ERROR'
              });
              
              if (attemptCount < maxAttempts) {
                // 재시도 전 지연 (백오프 전략)
                const delayMs = 2000 * Math.pow(2, attemptCount - 1);
                await new Promise(resolve => setTimeout(resolve, delayMs));
              }
            }
          }
          
          if (attemptCount === maxAttempts && lastError) {
            await updateStatus('transaction', 'ERROR', { 
              error: lastError.message, 
              attempts: attemptCount,
              maxAttempts: maxAttempts
            });
            throw lastError;
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
          console.error(`[${requestId}] 백그라운드 처리 중 최종 오류:`, errorMessage);
          txPipeline.status = 'ERROR';
          txPipeline.error = errorMessage;
        }
      };
      
      // 비동기 처리 시작 (응답과 무관하게 실행)
      processProposalCreationAsync().catch(error => {
        console.error(`[${requestId}] processProposalCreation 에러:`, error);
      });
      
      return; // 비동기 처리의 경우 여기서 함수 종료
    }
    
    // 동기식 처리 (기존 코드)
    // 트랜잭션 처리를 위한 서명자 생성
    const wallet = new ethers.Wallet(CONTRACT_PRIVATE_KEY, provider);
    const daoContract = new ethers.Contract(
      DAO_CONTRACT_ADDRESS,
      DAOABI,
      wallet
    );
    
    // 트랜잭션 전송
    const tx = await daoContract.createProposal(
      description,
      duration,
      numOptions,
      users
    );
    
    // 트랜잭션 확인 대기
    const receipt = await tx.wait();
    
    // 이벤트에서 proposalId 추출
    const event = receipt.events?.find((e: any) => e.event === 'ProposalCreated');
    const proposalId = event?.args?.proposalId.toNumber();
    
    res.json({
      success: true,
      message: '제안이 성공적으로 생성되었습니다',
      transactionHash: receipt.transactionHash,
      proposalId
    });
  } catch (error) {
    console.error('DAO 제안 생성 오류:', error);
    res.status(500).json({ error: '제안 생성 중 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/dao/{proposalId}/close:
 *   post:
 *     summary: DAO 제안 종료
 *     description: 특정 DAO 제안을 종료합니다. 비동기 처리 옵션을 통해 블록체인 트랜잭션 진행 상황을 추적할 수 있습니다.
 *     tags: [DAO]
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 종료할 제안의 ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               processAsync:
 *                 type: boolean
 *                 description: 비동기 처리 여부 (true인 경우 즉시 응답 반환 후 백그라운드에서 처리)
 *                 default: false
 *     responses:
 *       200:
 *         description: 제안 종료 성공 (동기 처리의 경우)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 transactionHash:
 *                   type: string
 *       202:
 *         description: 제안 종료 요청 접수됨 (비동기 처리의 경우)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 requestId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 statusCheckEndpoint:
 *                   type: string
 *       404:
 *         description: 제안을 찾을 수 없음
 *       400:
 *         description: 이미 종료된 제안
 *       500:
 *         description: 서버 오류
 */
router.post('/:proposalId/close', async (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params;
    const { processAsync = false } = req.body;
    
    // 요청 검증
    if (!CONTRACT_PRIVATE_KEY) {
      return res.status(500).json({ error: '컨트랙트 개인키 설정이 누락되었습니다' });
    }
    
    // 비동기 처리 요청된 경우
    if (processAsync) {
      // 요청 ID 생성 (트래킹용)
      const requestId = `dao-close-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      console.log(`[${requestId}] 비동기 DAO 제안 종료 요청 시작`);
      
      // 트랜잭션 파이프라인 생성
      const txPipeline: TransactionPipeline = {
        requestId,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        proposalId: Number(proposalId),
        description: "DAO 제안 종료 트랜잭션",
        option: { proposalId: Number(proposalId) },
        duration: 60,
        steps: {
          initialization: { status: 'PENDING', startTime: undefined, endTime: undefined },
          providerSetup: { status: 'PENDING', startTime: undefined, endTime: undefined },
          contractSetup: { status: 'PENDING', startTime: undefined, endTime: undefined },
          gasEstimation: { status: 'PENDING', startTime: undefined, endTime: undefined },
          nonceSetup: { status: 'PENDING', startTime: undefined, endTime: undefined },
          transaction: { status: 'PENDING', startTime: undefined, endTime: undefined, 
                         hash: undefined, attempts: 0, maxAttempts: 3 },
          confirmation: { status: 'PENDING', startTime: undefined, endTime: undefined, 
                          blockNumber: undefined, gasUsed: undefined }
        },
        result: undefined,
        error: undefined,
        txHash: undefined,
        blockExplorerLink: undefined,
        estimatedCompletionTime: undefined
      };
      
      // 즉시 응답 반환
      res.status(202).json({
        message: 'DAO 제안 종료 요청이 접수되었습니다',
        status: 'PENDING',
        requestId: requestId,
        proposalId,
        estimatedTime: '30초-2분',
        statusCheckEndpoint: `/api/dao/status/${requestId}`,
        steps: [
          { name: '요청 접수', status: 'COMPLETED' },
          { name: '환경 설정', status: 'PENDING' },
          { name: '네트워크 연결', status: 'PENDING' },
          { name: '트랜잭션 전송', status: 'PENDING' },
          { name: '블록체인 확인', status: 'PENDING' }
        ]
      });
      
      // 상태 업데이트 함수
      const updateStatus = async (
        step: TransactionStep, 
        status: TransactionStatus, 
        data: Record<string, any> = {}
      ) => {
        txPipeline.steps[step].status = status;
        
        if (status === 'IN_PROGRESS') {
          txPipeline.steps[step].startTime = new Date().toISOString();
        } else if (status === 'COMPLETED' || status === 'ERROR') {
          txPipeline.steps[step].endTime = new Date().toISOString();
        }
        
        // 추가 데이터 병합
        Object.assign(txPipeline.steps[step], data);
        
        // 전체 상태 업데이트
        if (step === 'transaction' && status === 'COMPLETED' && data.hash) {
          txPipeline.status = 'SUBMITTED';
          txPipeline.txHash = data.hash;
          txPipeline.blockExplorerLink = `https://sepolia.etherscan.io/tx/${data.hash}`;
        } else if (step === 'confirmation' && status === 'COMPLETED') {
          txPipeline.status = 'CONFIRMED';
          txPipeline.result = data;
        } else if (status === 'ERROR') {
          txPipeline.status = 'ERROR';
          txPipeline.error = data.error || '알 수 없는 오류';
        }
        
        console.log(`[${requestId}] 상태 업데이트: ${step} => ${status}`);
      };
      
      // 제안 종료 처리를 비동기적으로 진행
      const processCloseAsync = async () => {
        try {
          // 초기화 단계
          await updateStatus('initialization', 'IN_PROGRESS');
          
          if (!CONTRACT_PRIVATE_KEY) {
            await updateStatus('initialization', 'ERROR', { error: '컨트랙트 개인키 설정이 올바르지 않습니다' });
            throw new Error('컨트랙트 개인키 설정이 올바르지 않습니다');
          }
          
          if (!DAO_CONTRACT_ADDRESS || DAO_CONTRACT_ADDRESS === '0x0') {
            await updateStatus('initialization', 'ERROR', { error: 'DAO 컨트랙트 주소 설정이 올바르지 않습니다' });
            throw new Error('DAO 컨트랙트 주소 설정이 올바르지 않습니다');
          }
          
          // 실제 구현 시에는 마이그레이션 후 아래 주석을 해제하세요
          /*
          // 제안 존재 및 상태 확인
          const proposal = await prisma.dAOProposal.findUnique({
            where: { proposalId: Number(proposalId) }
          });
          
          if (!proposal) {
            await updateStatus('initialization', 'ERROR', { error: '제안을 찾을 수 없습니다' });
            throw new Error('제안을 찾을 수 없습니다');
          }
          
          if (proposal.status === 'CLOSED') {
            await updateStatus('initialization', 'ERROR', { error: '이미 종료된 제안입니다' });
            throw new Error('이미 종료된 제안입니다');
          }
          */
          
          await updateStatus('initialization', 'COMPLETED');
          
          // RPC 공급자 설정
          await updateStatus('providerSetup', 'IN_PROGRESS');
          let provider;
          try {
            provider = await setupRpcProvider();
            await updateStatus('providerSetup', 'COMPLETED');
          } catch (providerError) {
            const errorMessage = providerError instanceof Error ? providerError.message : '알 수 없는 오류';
            await updateStatus('providerSetup', 'ERROR', { error: errorMessage });
            throw new Error(`RPC 공급자 설정 실패: ${errorMessage}`);
          }
          
          // 컨트랙트 연결
          await updateStatus('contractSetup', 'IN_PROGRESS');
          const wallet = new ethers.Wallet(CONTRACT_PRIVATE_KEY, provider);
          const daoContract = new ethers.Contract(
            DAO_CONTRACT_ADDRESS,
            DAOABI,
            wallet
          );
          await updateStatus('contractSetup', 'COMPLETED', {
            contractAddress: DAO_CONTRACT_ADDRESS,
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
            gasLimit: 300000, // 제안 종료는 투표에 비슷한 가스 소모
          };
          
          // 가스 가격 설정
          await updateStatus('gasEstimation', 'IN_PROGRESS');
          try {
            const feeData = await provider.getFeeData();
            if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
              options.maxFeePerGas = feeData.maxFeePerGas.mul(120).div(100);
              options.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas.mul(110).div(100);
              await updateStatus('gasEstimation', 'COMPLETED', {
                maxFeePerGas: ethers.utils.formatUnits(options.maxFeePerGas, 'gwei'),
                maxPriorityFeePerGas: ethers.utils.formatUnits(options.maxPriorityFeePerGas, 'gwei'),
                type: 'EIP-1559'
              });
            } else if (feeData.gasPrice) {
              options.gasPrice = feeData.gasPrice;
              await updateStatus('gasEstimation', 'COMPLETED', {
                gasPrice: ethers.utils.formatUnits(options.gasPrice, 'gwei'),
                type: 'LEGACY'
              });
            }
          } catch (feeError) {
            await updateStatus('gasEstimation', 'COMPLETED', {
              warning: '가스 가격 최적화 실패, 기본값 사용',
              type: 'DEFAULT'
            });
          }
          
          // 논스 설정
          await updateStatus('nonceSetup', 'IN_PROGRESS');
          try {
            options.nonce = await wallet.getTransactionCount('pending');
            await updateStatus('nonceSetup', 'COMPLETED', { nonce: options.nonce });
          } catch (nonceError) {
            await updateStatus('nonceSetup', 'COMPLETED', { warning: '논스 가져오기 실패, 자동 설정 사용' });
          }
          
          // 트랜잭션 전송 - 재시도 로직 포함
          await updateStatus('transaction', 'IN_PROGRESS', { attempts: 0, maxAttempts: 3 });
          let attemptCount = 0;
          const maxAttempts = 3;
          let lastError: Error | null = null;
          
          while (attemptCount < maxAttempts) {
            try {
              attemptCount++;
              await updateStatus('transaction', 'IN_PROGRESS', { attempts: attemptCount });
              
              if (attemptCount > 1 && options.nonce !== undefined) {
                options.nonce = await wallet.getTransactionCount('pending');
                await updateStatus('transaction', 'IN_PROGRESS', { 
                  attempts: attemptCount,
                  nonce: options.nonce, 
                  message: '재시도 중...' 
                });
              }
              
              await updateStatus('transaction', 'IN_PROGRESS', { 
                startTime: new Date().toISOString(),
                message: '트랜잭션을 블록체인에 제출 중...' 
              });

              // 트랜잭션 제출 (타임아웃 30초)
              const txPromise = daoContract.closeProposal(proposalId, options);
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('타임아웃: 트랜잭션 제출이 30초 이상 소요되고 있습니다')), 30000);
              });

              let tx;
              let hasTimedOut = false;

              try {
                tx = await Promise.race([txPromise, timeoutPromise]);
              } catch (timeoutError: unknown) {
                if (timeoutError instanceof Error && timeoutError.message.includes('타임아웃')) {
                  hasTimedOut = true;
                  await updateStatus('transaction', 'IN_PROGRESS', { 
                    warning: '트랜잭션 제출이 지연되고 있습니다. 백그라운드에서 계속 진행 중입니다.',
                    estimatedWaitTime: '수 분이 소요될 수 있습니다.'
                  });
                  
                  tx = await txPromise;
                } else {
                  throw timeoutError;
                }
              }

              const txHash = tx.hash;
              await updateStatus('transaction', 'COMPLETED', { 
                txHash,
                blockExplorerLink: `${process.env.BLOCK_EXPLORER_URL || 'https://sepolia.etherscan.io'}/tx/${txHash}`,
                message: hasTimedOut ? '지연된 트랜잭션이 제출되었습니다.' : '트랜잭션이 성공적으로 제출되었습니다.' 
              });
              
              await updateStatus('confirmation', 'IN_PROGRESS', {
                txHash,
                startTime: new Date().toISOString()
              });
              
              // 블록 확인 진행 상황 업데이트 (15초마다)
              const confirmationUpdater = setInterval(async () => {
                try {
                  if (!provider) return;
                  
                  const currentBlock = await provider.getBlockNumber();
                  const startTimeStr = txPipeline.steps.confirmation.startTime;
                  const elapsedTimeMs = startTimeStr ? Date.now() - new Date(startTimeStr).getTime() : 0;
                  
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
              }, 15000);
              
              // 실제 트랜잭션 확인 대기
              const receipt = await tx.wait();
              clearInterval(confirmationUpdater);
              
              await updateStatus('confirmation', 'COMPLETED', {
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                blockExplorerLink: `${process.env.BLOCK_EXPLORER_URL || 'https://sepolia.etherscan.io'}/tx/${tx.hash}`
              });
              
              // 데이터베이스에서 제안 상태 업데이트 (마이그레이션 후 주석 해제)
              /*
              await prisma.dAOProposal.update({
                where: { proposalId: Number(proposalId) },
                data: {
                  status: 'CLOSED',
                  closedAt: new Date()
                }
              });
              */
              
              break; // 성공 시 반복문 종료
            } catch (txError) {
              lastError = txError instanceof Error ? txError : new Error(String(txError));
              
              await updateStatus('transaction', 'IN_PROGRESS', {
                attempts: attemptCount,
                error: lastError.message,
                status: attemptCount < maxAttempts ? 'RETRY' : 'ERROR'
              });
              
              if (attemptCount < maxAttempts) {
                // 재시도 전 지연 (백오프 전략)
                const delayMs = 2000 * Math.pow(2, attemptCount - 1);
                await new Promise(resolve => setTimeout(resolve, delayMs));
              }
            }
          }
          
          if (attemptCount === maxAttempts && lastError) {
            await updateStatus('transaction', 'ERROR', { 
              error: lastError.message, 
              attempts: attemptCount,
              maxAttempts: maxAttempts
            });
            throw lastError;
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
          console.error(`[${requestId}] 백그라운드 처리 중 최종 오류:`, errorMessage);
          txPipeline.status = 'ERROR';
          txPipeline.error = errorMessage;
        }
      };
      
      // 비동기 처리 시작
      processCloseAsync().catch(error => {
        console.error(`[${requestId}] processClose 에러:`, error);
      });
      
      return; // 비동기 처리의 경우 여기서 함수 종료
    }
    
    // 동기식 처리 (기존 코드)
    // 실제 구현 시에는 마이그레이션 후 아래 주석을 해제하세요
    /*
    // 제안 존재 및 상태 확인
    const proposal = await prisma.dAOProposal.findUnique({
      where: { proposalId: Number(proposalId) }
    });
    
    if (!proposal) {
      return res.status(404).json({ error: '제안을 찾을 수 없습니다' });
    }
    
    if (proposal.status === 'CLOSED') {
      return res.status(400).json({ error: '이미 종료된 제안입니다' });
    }
    */
    
    // 트랜잭션 처리
    const wallet = new ethers.Wallet(CONTRACT_PRIVATE_KEY, provider);
    const daoContract = new ethers.Contract(
      DAO_CONTRACT_ADDRESS,
      DAOABI,
      wallet
    );
    
    const tx = await daoContract.closeProposal(proposalId);
    const receipt = await tx.wait();
    
    // 데이터베이스에서 제안 상태 업데이트
    /*
    await prisma.dAOProposal.update({
      where: { proposalId: Number(proposalId) },
      data: {
        status: 'CLOSED',
        closedAt: new Date()
      }
    });
    */
    
    res.json({
      success: true,
      message: '제안이 성공적으로 종료되었습니다',
      transactionHash: receipt.transactionHash
    });
  } catch (error) {
    console.error('DAO 제안 종료 오류:', error);
    res.status(500).json({ error: '제안 종료 처리 중 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/dao/{proposalId}/vote:
 *   post:
 *     summary: DAO 제안에 투표
 *     description: 특정 DAO 제안에 투표합니다. 비동기 처리 옵션을 통해 블록체인 트랜잭션 진행 상황을 추적할 수 있습니다.
 *     tags: [DAO]
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 투표할 제안의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - option
 *             properties:
 *               option:
 *                 type: integer
 *                 description: 투표 옵션 (0부터 시작하는 인덱스)
 *               processAsync:
 *                 type: boolean
 *                 description: 비동기 처리 여부 (true인 경우 즉시 응답 반환 후 백그라운드에서 처리)
 *                 default: false
 *     responses:
 *       200:
 *         description: 투표 성공 (동기 처리의 경우)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 transactionHash:
 *                   type: string
 *       400:
 *         description: 잘못된 요청 또는 투표 권한 없음
 *       404:
 *         description: 제안을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.post('/:proposalId/vote', async (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params;
    const { option, processAsync = false } = req.body;
    
    // 요청 검증
    if (option === undefined) {
      return res.status(400).json({ error: '투표 옵션은 필수입니다' });
    }
    
    if (!CONTRACT_PRIVATE_KEY) {
      return res.status(500).json({ error: '컨트랙트 개인키 설정이 누락되었습니다' });
    }
    
    // 비동기 처리 요청된 경우
    if (processAsync) {
      // 요청 ID 생성 (트래킹용)
      const requestId = `dao-vote-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      console.log(`[${requestId}] 비동기 DAO 투표 요청 시작`);
      
      // 트랜잭션 파이프라인 생성
      const txPipeline: TransactionPipeline = {
        requestId,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        proposalId: Number(proposalId),
        description: "DAO 투표 트랜잭션",
        option: { 
          proposalId: Number(proposalId),
          voteOption: option 
        },
        duration: 60,
        steps: {
          initialization: { status: 'PENDING', startTime: undefined, endTime: undefined },
          providerSetup: { status: 'PENDING', startTime: undefined, endTime: undefined },
          contractSetup: { status: 'PENDING', startTime: undefined, endTime: undefined },
          gasEstimation: { status: 'PENDING', startTime: undefined, endTime: undefined },
          nonceSetup: { status: 'PENDING', startTime: undefined, endTime: undefined },
          transaction: { status: 'PENDING', startTime: undefined, endTime: undefined, 
                         hash: undefined, attempts: 0, maxAttempts: 3 },
          confirmation: { status: 'PENDING', startTime: undefined, endTime: undefined, 
                          blockNumber: undefined, gasUsed: undefined }
        },
        result: undefined,
        error: undefined,
        txHash: undefined,
        blockExplorerLink: undefined,
        estimatedCompletionTime: undefined
      };
      
      // 즉시 응답 반환 (트랜잭션 처리는 백그라운드에서 계속)
      res.status(202).json({
        message: 'DAO 투표 요청이 접수되었습니다',
        status: 'PENDING',
        requestId: requestId,
        // 사용자 경험 개선을 위한 추가 정보
        estimatedTime: '30초-2분', // 예상 소요 시간
        statusCheckEndpoint: `/api/dao/status/${requestId}`, // 상태 확인 엔드포인트
        steps: [
          { name: '요청 접수', status: 'COMPLETED' },
          { name: '환경 설정', status: 'PENDING' },
          { name: '네트워크 연결', status: 'PENDING' },
          { name: '트랜잭션 전송', status: 'PENDING' },
          { name: '블록체인 확인', status: 'PENDING' }
        ]
      });
      
      // 여기서부터는 response와 무관하게 백그라운드에서 처리됨
      // 상태 업데이트, 트랜잭션 처리 등의 비동기 작업을 위한 코드가 이어짐
      
      return; // 비동기 처리의 경우 여기서 함수 종료
    }
    
    // 동기식 처리 (기존 코드)
    // 트랜잭션 처리를 위한 서명자 생성
    const wallet = new ethers.Wallet(CONTRACT_PRIVATE_KEY, provider);
    const daoContract = new ethers.Contract(
      DAO_CONTRACT_ADDRESS,
      DAOABI,
      wallet
    );
    
    // 트랜잭션 전송
    const tx = await daoContract.vote(proposalId, option);
    
    // 트랜잭션 확인 대기
    const receipt = await tx.wait();
    
    // 이벤트에서 데이터 추출 (필요한 경우)
    const votedEvent = receipt.events?.find((e: any) => e.event === 'Voted');
    const votedProposalId = votedEvent?.args?.proposalId?.toNumber();
    
    res.json({
      success: true,
      message: '투표가 성공적으로 처리되었습니다',
      transactionHash: receipt.transactionHash,
      proposalId: votedProposalId
    });
  } catch (error) {
    console.error('DAO 투표 오류:', error);
    res.status(500).json({ error: '투표 처리 중 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/dao/createAsync:
 *   post:
 *     summary: 새 DAO 제안 비동기 생성
 *     description: 새로운 DAO 제안을 비동기적으로 생성합니다. 트랜잭션 진행 상황을 추적할 수 있습니다.
 *     tags: [DAO]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - duration
 *               - numOptions
 *               - users
 *             properties:
 *               description:
 *                 type: string
 *                 description: 제안 설명
 *               duration:
 *                 type: integer
 *                 description: 제안 기간(초)
 *               numOptions:
 *                 type: integer
 *                 description: 투표 옵션 수
 *               users:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 투표 가능한 사용자 주소 목록
 *     responses:
 *       202:
 *         description: 제안 생성 요청 접수됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 requestId:
 *                   type: string
 *                 status:
 *                   type: string
 *       400:
 *         description: 잘못된 요청 또는 필수 매개변수 누락
 *       500:
 *         description: 서버 오류
 */
router.post('/createAsync', async (req: Request, res: Response) => {
  console.time('비동기 DAO 제안 요청 처리');
  
  // 요청 ID 생성 (트래킹용)
  const requestId = `dao-proposal-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  console.log(`[${requestId}] 비동기 DAO 제안 요청 시작`);
  
  try {
    const { description, duration, numOptions, users } = req.body;
    
    // 요청 검증
    if (!description || !duration || !numOptions || !users) {
      console.timeEnd('비동기 DAO 제안 요청 처리');
      return res.status(400).json({ error: '필수 정보가 누락되었습니다' });
    }
    
    // 트랜잭션 파이프라인 생성 - 사용자 경험 개선을 위한 단계적 상태 추적
    const txPipeline: TransactionPipeline = {
      requestId,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      description, // 요청에서 받은 실제 description 사용
      option: { 
        numOptions, 
        users 
      }, // req.body에서 가져온 값 사용
      duration, // 요청에서 받은 실제 duration 사용
      steps: {
        initialization: { status: 'PENDING', startTime: undefined, endTime: undefined },
        providerSetup: { status: 'PENDING', startTime: undefined, endTime: undefined },
        contractSetup: { status: 'PENDING', startTime: undefined, endTime: undefined },
        gasEstimation: { status: 'PENDING', startTime: undefined, endTime: undefined },
        nonceSetup: { status: 'PENDING', startTime: undefined, endTime: undefined },
        transaction: { status: 'PENDING', startTime: undefined, endTime: undefined, 
                       hash: undefined, attempts: 0, maxAttempts: 3 },
        confirmation: { status: 'PENDING', startTime: undefined, endTime: undefined, 
                        blockNumber: undefined, gasUsed: undefined }
      },
      result: undefined,
      error: undefined,
      txHash: undefined,
      blockExplorerLink: undefined,
      estimatedCompletionTime: undefined
    };
    
    // DB에 상태 저장 (실제 구현 시 주석 해제)
    /*
    await prisma.$executeRaw`
      INSERT INTO "TransactionStatus" (
        "requestId", "type", "status", "createdAt", "metadata"
      ) VALUES (
        ${requestId}, 'DAO_PROPOSAL', 'PENDING', NOW(), ${JSON.stringify(txPipeline)}::jsonb
      )
    `;
    */
    
    // 즉시 응답 반환 (트랜잭션 처리는 백그라운드에서 계속)
    res.status(202).json({
      message: 'DAO 제안 생성 요청이 접수되었습니다',
      status: 'PENDING',
      requestId: requestId,
      // 사용자 경험 개선을 위한 추가 정보
      estimatedTime: '1-3분', // 예상 소요 시간
      statusCheckEndpoint: `/api/dao/status/${requestId}`, // 상태 확인 엔드포인트
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
      txPipeline.steps[step].status = status;
      
      if (status === 'IN_PROGRESS') {
        txPipeline.steps[step].startTime = new Date().toISOString();
      } else if (status === 'COMPLETED' || status === 'ERROR') {
        txPipeline.steps[step].endTime = new Date().toISOString();
      }
      
      // 추가 데이터 병합
      Object.assign(txPipeline.steps[step], data);
      
      // 전체 상태 업데이트
      if (step === 'transaction' && status === 'COMPLETED' && data.hash) {
        txPipeline.status = 'SUBMITTED';
        txPipeline.txHash = data.hash;
        txPipeline.blockExplorerLink = `https://sepolia.etherscan.io/tx/${data.hash}`;
      } else if (step === 'confirmation' && status === 'COMPLETED') {
        txPipeline.status = 'CONFIRMED';
        txPipeline.result = data;
      } else if (status === 'ERROR') {
        txPipeline.status = 'ERROR';
        txPipeline.error = data.error || '알 수 없는 오류';
      }
      
      // 여기서 DB 업데이트, 웹소켓 이벤트 발송 등 수행 가능
      console.log(`[${requestId}] 상태 업데이트: ${step} => ${status}`);
      // 실제 구현 시: await prisma.$executeRaw`UPDATE "TransactionStatus" ...`;
    };
    
    // DAO 제안 생성 처리를 비동기적으로 진행
    const processProposalCreation = async () => {
      try {
        // 초기화 단계
        await updateStatus('initialization', 'IN_PROGRESS');
        console.time(`[${requestId}] 환경 변수 및 설정 로드`);
        
        if (!CONTRACT_PRIVATE_KEY) {
          await updateStatus('initialization', 'ERROR', { error: '컨트랙트 개인키 설정이 올바르지 않습니다' });
          throw new Error('컨트랙트 개인키 설정이 올바르지 않습니다');
        }
        
        if (!DAO_CONTRACT_ADDRESS || DAO_CONTRACT_ADDRESS === '0x0') {
          await updateStatus('initialization', 'ERROR', { error: 'DAO 컨트랙트 주소 설정이 올바르지 않습니다' });
          throw new Error('DAO 컨트랙트 주소 설정이 올바르지 않습니다');
        }
        
        console.timeEnd(`[${requestId}] 환경 변수 및 설정 로드`);
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
        
        // 컨트랙트 연결
        await updateStatus('contractSetup', 'IN_PROGRESS');
        console.time(`[${requestId}] 컨트랙트 연결`);
        const wallet = new ethers.Wallet(CONTRACT_PRIVATE_KEY, provider);
        const daoContract = new ethers.Contract(
          DAO_CONTRACT_ADDRESS,
          DAOABI,
          wallet
        );
        console.log(`[${requestId}] 컨트랙트 주소: ${DAO_CONTRACT_ADDRESS}`);
        console.log(`[${requestId}] 지갑 주소: ${wallet.address}`);
        console.timeEnd(`[${requestId}] 컨트랙트 연결`);
        await updateStatus('contractSetup', 'COMPLETED', {
          contractAddress: DAO_CONTRACT_ADDRESS,
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
        
        while (attemptCount < maxAttempts) {
          try {
            attemptCount++;
            await updateStatus('transaction', 'IN_PROGRESS', { attempts: attemptCount });
            console.log(`[${requestId}] 트랜잭션 시도 ${attemptCount}/${maxAttempts}`);
            console.time(`[${requestId}] 트랜잭션 전송 시도 ${attemptCount}`);
            
            // 트랜잭션 준비 - 사용자에게 표시될 시각적 단계
            console.log(`[${requestId}] 트랜잭션 준비 - 제안 생성: ${description}, 기간: ${duration}초, 옵션 수: ${numOptions}`);
            
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
            const txPromise = daoContract.createProposal(
              description,
              duration,
              numOptions,
              users,
              options
            );
            
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
              blockExplorerLink: `${process.env.BLOCK_EXPLORER_URL || 'https://sepolia.etherscan.io'}/tx/${txHash}`,
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
                  const startTimeStr = txPipeline.steps.confirmation.startTime;
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
            
            // 이벤트에서 proposalId 추출
            const event = receipt.events?.find((e: any) => e.event === 'ProposalCreated');
            const proposalId = event?.args?.proposalId.toNumber();
            
            console.log(`[${requestId}] DAO 제안 생성 완료: 제안 ID ${proposalId}, 트랜잭션 해시 ${tx.hash}`);
            
            await updateStatus('confirmation', 'COMPLETED', {
              blockNumber: receipt.blockNumber,
              gasUsed: receipt.gasUsed.toString(),
              proposalId,
              blockExplorerLink: `${process.env.BLOCK_EXPLORER_URL || 'https://sepolia.etherscan.io'}/tx/${tx.hash}`
            });
            
            // DB에 제안 저장 (마이그레이션 후 주석 해제)
            /*
            await prisma.dAOProposal.create({
              data: {
                proposalId: proposalId,
                description,
                sessionId: 1, // 세션 ID는 요청에서 받거나 적절히 설정
                voteEndTime: new Date(Date.now() + duration * 1000),
                status: 'ACTIVE',
                transactionHash: tx.hash
              }
            });
            */
            
            break; // 성공 시 반복문 종료
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
          console.error(`[${requestId}] 최대 시도 횟수 도달. DAO 제안 생성 실패.`);
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
        txPipeline.status = 'ERROR';
        txPipeline.error = errorMessage;
      } finally {
        console.timeEnd('비동기 DAO 제안 요청 처리');
      }
    };
    
    // 비동기 처리 시작 (응답과 무관하게 실행)
    processProposalCreation().catch(error => {
      console.error(`[${requestId}] processProposalCreation 에러:`, error);
    });
    
  } catch (error) {
    console.error(`DAO 제안 생성 요청 처리 오류:`, error);
    console.timeEnd('비동기 DAO 제안 요청 처리');
    
    // 이미 응답을 보냈는지 확인
    if (!res.headersSent) {
      if (error instanceof Error) {
        res.status(500).json({ error: 'DAO 제안 생성 요청 처리 중 오류가 발생했습니다: ' + error.message });
      } else {
        res.status(500).json({ error: 'DAO 제안 생성 요청 처리 중 알 수 없는 오류가 발생했습니다' });
      }
    }
  }
});

/**
 * @swagger
 * /api/dao/status/{requestId}:
 *   get:
 *     summary: DAO 제안 생성 상태 조회
 *     description: 특정 요청 ID를 사용하여 DAO 제안 생성 상태를 조회합니다.
 *     tags: [DAO]
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: 제안 생성 요청 ID
 *     responses:
 *       200:
 *         description: 상태 조회 성공
 *       404:
 *         description: 요청을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get('/status/:requestId', (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    
    // 트랜잭션 파이프라인 조회
    const pipeline = transactionPipelines.get(requestId);
    if (!pipeline) {
      return res.status(404).json({ 
        error: '요청 ID를 찾을 수 없습니다',
        message: '존재하지 않는 요청이거나 요청 정보가 만료되었습니다.'
      });
    }
    
    // 전체 진행률 계산
    let totalSteps = 0;
    let completedSteps = 0;
    let inProgressSteps = 0;
    let errorSteps = 0;
    
    Object.values(pipeline.steps).forEach(step => {
      totalSteps++;
      if (step.status === 'COMPLETED') completedSteps++;
      if (step.status === 'IN_PROGRESS') inProgressSteps++;
      if (step.status === 'ERROR') errorSteps++;
    });
    
    // 현재 진행 중인 단계 찾기
    let currentStepName = '';
    let currentStepStatus = '';
    let currentStepMessage = '';
    
    for (const [stepName, stepInfo] of Object.entries(pipeline.steps)) {
      if (stepInfo.status === 'IN_PROGRESS' || stepInfo.status === 'PENDING') {
        currentStepName = stepName;
        currentStepStatus = stepInfo.status;
        currentStepMessage = stepInfo.message || '';
        break;
      }
    }
    
    // 결과 반환
    res.json({
      requestId: pipeline.requestId,
      status: pipeline.status,
      createdAt: pipeline.createdAt,
      elapsedTime: new Date().getTime() - new Date(pipeline.createdAt).getTime(),
      progress: Math.floor((completedSteps / totalSteps) * 100),
      currentStep: currentStepName,
      currentStepStatus,
      currentStepMessage,
      txHash: pipeline.txHash,
      blockExplorerLink: pipeline.blockExplorerLink,
      steps: pipeline.steps,
      error: pipeline.error,
      result: pipeline.result
    });
  } catch (error) {
    console.error('트랜잭션 상태 조회 오류:', error);
    res.status(500).json({ error: '트랜잭션 상태 조회 중 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/dao/{proposalId}/voteAsync:
 *   post:
 *     summary: DAO 제안에 비동기 투표
 *     description: 특정 DAO 제안에 비동기적으로 투표합니다. 트랜잭션 진행 상황을 추적할 수 있습니다.
 *     tags: [DAO]
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 투표할 제안의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - option
 *             properties:
 *               option:
 *                 type: integer
 *                 description: 투표 옵션 (0부터 시작하는 인덱스)
 *     responses:
 *       202:
 *         description: 투표 요청 접수됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 requestId:
 *                   type: string
 *                 status:
 *                   type: string
 *       400:
 *         description: 잘못된 요청 또는 투표 권한 없음
 *       404:
 *         description: 제안을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.post('/:proposalId/voteAsync', async (req: Request, res: Response) => {
  console.time('비동기 DAO 투표 요청 처리');
  
  // 요청 ID 생성 (트래킹용)
  const requestId = `dao-vote-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  console.log(`[${requestId}] 비동기 DAO 투표 요청 시작`);
  
  try {
    const { proposalId } = req.params;
    const { option } = req.body;
    
    // 요청 검증
    if (option === undefined) {
      console.timeEnd('비동기 DAO 투표 요청 처리');
      return res.status(400).json({ error: '투표 옵션은 필수입니다' });
    }
    
    // 트랜잭션 파이프라인 생성
    const txPipeline: TransactionPipeline = {
      requestId,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      proposalId: Number(proposalId),
      description: "DAO 투표 트랜잭션",
      option: { 
        proposalId: Number(proposalId), 
        voteOption: option 
      },
      duration: 60,
      steps: {
        initialization: { status: 'PENDING', startTime: undefined, endTime: undefined },
        providerSetup: { status: 'PENDING', startTime: undefined, endTime: undefined },
        contractSetup: { status: 'PENDING', startTime: undefined, endTime: undefined },
        gasEstimation: { status: 'PENDING', startTime: undefined, endTime: undefined },
        nonceSetup: { status: 'PENDING', startTime: undefined, endTime: undefined },
        transaction: { status: 'PENDING', startTime: undefined, endTime: undefined, 
                       hash: undefined, attempts: 0, maxAttempts: 3 },
        confirmation: { status: 'PENDING', startTime: undefined, endTime: undefined, 
                        blockNumber: undefined, gasUsed: undefined }
      },
      result: undefined,
      error: undefined,
      txHash: undefined,
      blockExplorerLink: undefined,
      estimatedCompletionTime: undefined
    };
    
    // 즉시 응답 반환
    res.status(202).json({
      message: 'DAO 투표 요청이 접수되었습니다',
      status: 'PENDING',
      requestId: requestId,
      proposalId,
      voteOption: option,
      estimatedTime: '30초-2분',
      statusCheckEndpoint: `/api/dao/status/${requestId}`,
      steps: [
        { name: '요청 접수', status: 'COMPLETED' },
        { name: '환경 설정', status: 'PENDING' },
        { name: '네트워크 연결', status: 'PENDING' },
        { name: '트랜잭션 전송', status: 'PENDING' },
        { name: '블록체인 확인', status: 'PENDING' }
      ]
    });
    
    // 상태 업데이트 함수
    const updateStatus = async (
      step: TransactionStep, 
      status: TransactionStatus, 
      data: Record<string, any> = {}
    ) => {
      txPipeline.steps[step].status = status;
      
      if (status === 'IN_PROGRESS') {
        txPipeline.steps[step].startTime = new Date().toISOString();
      } else if (status === 'COMPLETED' || status === 'ERROR') {
        txPipeline.steps[step].endTime = new Date().toISOString();
      }
      
      // 추가 데이터 병합
      Object.assign(txPipeline.steps[step], data);
      
      // 전체 상태 업데이트
      if (step === 'transaction' && status === 'COMPLETED' && data.hash) {
        txPipeline.status = 'SUBMITTED';
        txPipeline.txHash = data.hash;
        txPipeline.blockExplorerLink = `https://sepolia.etherscan.io/tx/${data.hash}`;
      } else if (step === 'confirmation' && status === 'COMPLETED') {
        txPipeline.status = 'CONFIRMED';
        txPipeline.result = data;
      } else if (status === 'ERROR') {
        txPipeline.status = 'ERROR';
        txPipeline.error = data.error || '알 수 없는 오류';
      }
      
      console.log(`[${requestId}] 상태 업데이트: ${step} => ${status}`);
    };
    
    // 투표 처리를 비동기적으로 진행
    const processVote = async () => {
      try {
        // 초기화 단계
        await updateStatus('initialization', 'IN_PROGRESS');
        
        if (!CONTRACT_PRIVATE_KEY) {
          await updateStatus('initialization', 'ERROR', { error: '컨트랙트 개인키 설정이 올바르지 않습니다' });
          throw new Error('컨트랙트 개인키 설정이 올바르지 않습니다');
        }
        
        if (!DAO_CONTRACT_ADDRESS || DAO_CONTRACT_ADDRESS === '0x0') {
          await updateStatus('initialization', 'ERROR', { error: 'DAO 컨트랙트 주소 설정이 올바르지 않습니다' });
          throw new Error('DAO 컨트랙트 주소 설정이 올바르지 않습니다');
        }
        
        // 실제 구현 시에는 마이그레이션 후 아래 주석을 해제하세요
        /*
        // 제안 존재 및 상태 확인
        const proposal = await prisma.dAOProposal.findUnique({
          where: { proposalId: Number(proposalId) }
        });
        
        if (!proposal) {
          await updateStatus('initialization', 'ERROR', { error: '제안을 찾을 수 없습니다' });
          throw new Error('제안을 찾을 수 없습니다');
        }
        
        if (proposal.status !== 'ACTIVE') {
          await updateStatus('initialization', 'ERROR', { error: '진행 중인 제안에만 투표할 수 있습니다' });
          throw new Error('진행 중인 제안에만 투표할 수 있습니다');
        }
        */
        
        await updateStatus('initialization', 'COMPLETED');
        
        // RPC 공급자 설정
        await updateStatus('providerSetup', 'IN_PROGRESS');
        let provider;
        try {
          provider = await setupRpcProvider();
          await updateStatus('providerSetup', 'COMPLETED');
        } catch (providerError) {
          const errorMessage = providerError instanceof Error ? providerError.message : '알 수 없는 오류';
          await updateStatus('providerSetup', 'ERROR', { error: errorMessage });
          throw new Error(`RPC 공급자 설정 실패: ${errorMessage}`);
        }
        
        // 컨트랙트 연결
        await updateStatus('contractSetup', 'IN_PROGRESS');
        const wallet = new ethers.Wallet(CONTRACT_PRIVATE_KEY, provider);
        const daoContract = new ethers.Contract(
          DAO_CONTRACT_ADDRESS,
          DAOABI,
          wallet
        );
        await updateStatus('contractSetup', 'COMPLETED', {
          contractAddress: DAO_CONTRACT_ADDRESS,
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
          gasLimit: 300000, // 투표는 제안 생성보다 가스 소모가 적음
        };
        
        // 가스 가격 설정
        await updateStatus('gasEstimation', 'IN_PROGRESS');
        try {
          const feeData = await provider.getFeeData();
          if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
            options.maxFeePerGas = feeData.maxFeePerGas.mul(120).div(100);
            options.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas.mul(110).div(100);
            await updateStatus('gasEstimation', 'COMPLETED', {
              maxFeePerGas: ethers.utils.formatUnits(options.maxFeePerGas, 'gwei'),
              maxPriorityFeePerGas: ethers.utils.formatUnits(options.maxPriorityFeePerGas, 'gwei'),
              type: 'EIP-1559'
            });
          } else if (feeData.gasPrice) {
            options.gasPrice = feeData.gasPrice;
            await updateStatus('gasEstimation', 'COMPLETED', {
              gasPrice: ethers.utils.formatUnits(options.gasPrice, 'gwei'),
              type: 'LEGACY'
            });
          }
        } catch (feeError) {
          await updateStatus('gasEstimation', 'COMPLETED', {
            warning: '가스 가격 최적화 실패, 기본값 사용',
            type: 'DEFAULT'
          });
        }
        
        // 논스 설정
        await updateStatus('nonceSetup', 'IN_PROGRESS');
        try {
          options.nonce = await wallet.getTransactionCount('pending');
          await updateStatus('nonceSetup', 'COMPLETED', { nonce: options.nonce });
        } catch (nonceError) {
          await updateStatus('nonceSetup', 'COMPLETED', { warning: '논스 가져오기 실패, 자동 설정 사용' });
        }
        
        // 트랜잭션 전송 - 재시도 로직 포함
        await updateStatus('transaction', 'IN_PROGRESS', { attempts: 0, maxAttempts: 3 });
        let attemptCount = 0;
        const maxAttempts = 3;
        let lastError: Error | null = null;
        
        while (attemptCount < maxAttempts) {
          try {
            attemptCount++;
            await updateStatus('transaction', 'IN_PROGRESS', { attempts: attemptCount });
            
            // 트랜잭션 준비
            console.log(`[${requestId}] 트랜잭션 준비 - 제안 ID: ${proposalId}, 옵션: ${option}`);
            
            if (attemptCount > 1 && options.nonce !== undefined) {
              options.nonce = await wallet.getTransactionCount('pending');
              await updateStatus('transaction', 'IN_PROGRESS', { 
                attempts: attemptCount,
                nonce: options.nonce, 
                message: '재시도 중...' 
              });
            }
            
            await updateStatus('transaction', 'IN_PROGRESS', { 
              startTime: new Date().toISOString(),
              message: '트랜잭션을 블록체인에 제출 중...' 
            });

            // 트랜잭션 제출 (타임아웃 30초)
            const txPromise = daoContract.vote(proposalId, option, options);
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('타임아웃: 트랜잭션 제출이 30초 이상 소요되고 있습니다')), 30000);
            });

            let tx;
            let hasTimedOut = false;

            try {
              tx = await Promise.race([txPromise, timeoutPromise]);
            } catch (timeoutError: unknown) {
              if (timeoutError instanceof Error && timeoutError.message.includes('타임아웃')) {
                hasTimedOut = true;
                await updateStatus('transaction', 'IN_PROGRESS', { 
                  warning: '트랜잭션 제출이 지연되고 있습니다. 백그라운드에서 계속 진행 중입니다.'
                });
                
                tx = await txPromise;
              } else {
                throw timeoutError;
              }
            }

            const txHash = tx.hash;
            await updateStatus('transaction', 'COMPLETED', { 
              txHash,
              blockExplorerLink: `${process.env.BLOCK_EXPLORER_URL || 'https://sepolia.etherscan.io'}/tx/${txHash}`,
              message: hasTimedOut ? '지연된 트랜잭션이 제출되었습니다.' : '트랜잭션이 성공적으로 제출되었습니다.' 
            });
            
            await updateStatus('confirmation', 'IN_PROGRESS', {
              txHash,
              startTime: new Date().toISOString()
            });
            
            // 블록 확인 진행 상황 업데이트 (15초마다)
            const confirmationUpdater = setInterval(async () => {
              try {
                if (!provider) return;
                
                const currentBlock = await provider.getBlockNumber();
                const startTimeStr = txPipeline.steps.confirmation.startTime;
                const elapsedTimeMs = startTimeStr ? Date.now() - new Date(startTimeStr).getTime() : 0;
                
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
            }, 15000);
            
            // 실제 트랜잭션 확인 대기
            const receipt = await tx.wait();
            clearInterval(confirmationUpdater);
            
            await updateStatus('confirmation', 'COMPLETED', {
              blockNumber: receipt.blockNumber,
              gasUsed: receipt.gasUsed.toString(),
              blockExplorerLink: `${process.env.BLOCK_EXPLORER_URL || 'https://sepolia.etherscan.io'}/tx/${tx.hash}`
            });
            
            // 데이터베이스에 투표 기록 저장 (마이그레이션 후 주석 해제)
            /*
            await prisma.dAOVote.create({
              data: {
                proposalId: Number(proposalId),
                voter: wallet.address,
                option,
                transactionHash: tx.hash
              }
            });
            */
            
            break; // 성공 시 반복문 종료
          } catch (txError) {
            lastError = txError instanceof Error ? txError : new Error(String(txError));
            
            await updateStatus('transaction', 'IN_PROGRESS', {
              attempts: attemptCount,
              error: lastError.message,
              status: attemptCount < maxAttempts ? 'RETRY' : 'ERROR'
            });
            
            if (attemptCount < maxAttempts) {
              // 재시도 전 지연 (백오프 전략)
              const delayMs = 2000 * Math.pow(2, attemptCount - 1);
              await new Promise(resolve => setTimeout(resolve, delayMs));
            }
          }
        }
        
        if (attemptCount === maxAttempts && lastError) {
          await updateStatus('transaction', 'ERROR', { 
            error: lastError.message, 
            attempts: attemptCount,
            maxAttempts: maxAttempts
          });
          throw lastError;
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        console.error(`[${requestId}] 백그라운드 처리 중 최종 오류:`, errorMessage);
        txPipeline.status = 'ERROR';
        txPipeline.error = errorMessage;
      } finally {
        console.timeEnd('비동기 DAO 투표 요청 처리');
      }
    };
    
    // 비동기 처리 시작
    processVote().catch(error => {
      console.error(`[${requestId}] processVote 에러:`, error);
    });
    
  } catch (error) {
    console.error(`DAO 투표 요청 처리 오류:`, error);
    console.timeEnd('비동기 DAO 투표 요청 처리');
    
    if (!res.headersSent) {
      if (error instanceof Error) {
        res.status(500).json({ error: 'DAO 투표 요청 처리 중 오류가 발생했습니다: ' + error.message });
      } else {
        res.status(500).json({ error: 'DAO 투표 요청 처리 중 알 수 없는 오류가 발생했습니다' });
      }
    }
  }
});

/**
 * @swagger
 * /api/dao/{proposalId}/closeAsync:
 *   post:
 *     summary: DAO 제안 비동기 종료
 *     description: 특정 DAO 제안을 비동기적으로 종료합니다. 트랜잭션 진행 상황을 추적할 수 있습니다.
 *     tags: [DAO]
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 종료할 제안의 ID
 *     responses:
 *       202:
 *         description: 제안 종료 요청 접수됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 requestId:
 *                   type: string
 *                 status:
 *                   type: string
 *       400:
 *         description: 잘못된 요청 또는 이미 종료된 제안
 *       404:
 *         description: 제안을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.post('/:proposalId/closeAsync', async (req: Request, res: Response) => {
  console.time('비동기 DAO 제안 종료 요청 처리');
  
  // 요청 ID 생성 (트래킹용)
  const requestId = `dao-close-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  console.log(`[${requestId}] 비동기 DAO 제안 종료 요청 시작`);
  
  try {
    const { proposalId } = req.params;
    
    if (!CONTRACT_PRIVATE_KEY) {
      console.timeEnd('비동기 DAO 제안 종료 요청 처리');
      return res.status(500).json({ error: '컨트랙트 개인키 설정이 누락되었습니다' });
    }
    
    // 트랜잭션 파이프라인 생성
    const txPipeline: TransactionPipeline = {
      requestId,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      proposalId: Number(proposalId),
      description: "DAO 제안 종료 트랜잭션",
      option: { proposalId: Number(proposalId) },
      duration: 60,
      steps: {
        initialization: { status: 'PENDING', startTime: undefined, endTime: undefined },
        providerSetup: { status: 'PENDING', startTime: undefined, endTime: undefined },
        contractSetup: { status: 'PENDING', startTime: undefined, endTime: undefined },
        gasEstimation: { status: 'PENDING', startTime: undefined, endTime: undefined },
        nonceSetup: { status: 'PENDING', startTime: undefined, endTime: undefined },
        transaction: { status: 'PENDING', startTime: undefined, endTime: undefined, 
                       hash: undefined, attempts: 0, maxAttempts: 3 },
        confirmation: { status: 'PENDING', startTime: undefined, endTime: undefined, 
                        blockNumber: undefined, gasUsed: undefined }
      },
      result: undefined,
      error: undefined,
      txHash: undefined,
      blockExplorerLink: undefined,
      estimatedCompletionTime: undefined
    };
    
    // 즉시 응답 반환
    res.status(202).json({
      message: 'DAO 제안 종료 요청이 접수되었습니다',
      status: 'PENDING',
      requestId: requestId,
      proposalId,
      estimatedTime: '30초-2분',
      statusCheckEndpoint: `/api/dao/status/${requestId}`,
      steps: [
        { name: '요청 접수', status: 'COMPLETED' },
        { name: '환경 설정', status: 'PENDING' },
        { name: '네트워크 연결', status: 'PENDING' },
        { name: '트랜잭션 전송', status: 'PENDING' },
        { name: '블록체인 확인', status: 'PENDING' }
      ]
    });
    
    // 상태 업데이트 함수
    const updateStatus = async (
      step: TransactionStep, 
      status: TransactionStatus, 
      data: Record<string, any> = {}
    ) => {
      txPipeline.steps[step].status = status;
      
      if (status === 'IN_PROGRESS') {
        txPipeline.steps[step].startTime = new Date().toISOString();
      } else if (status === 'COMPLETED' || status === 'ERROR') {
        txPipeline.steps[step].endTime = new Date().toISOString();
      }
      
      // 추가 데이터 병합
      Object.assign(txPipeline.steps[step], data);
      
      // 전체 상태 업데이트
      if (step === 'transaction' && status === 'COMPLETED' && data.hash) {
        txPipeline.status = 'SUBMITTED';
        txPipeline.txHash = data.hash;
        txPipeline.blockExplorerLink = `https://sepolia.etherscan.io/tx/${data.hash}`;
      } else if (step === 'confirmation' && status === 'COMPLETED') {
        txPipeline.status = 'CONFIRMED';
        txPipeline.result = data;
      } else if (status === 'ERROR') {
        txPipeline.status = 'ERROR';
        txPipeline.error = data.error || '알 수 없는 오류';
      }
      
      console.log(`[${requestId}] 상태 업데이트: ${step} => ${status}`);
    };
    
    // 제안 종료 처리를 비동기적으로 진행
    const processClose = async () => {
      try {
        // 초기화 단계
        await updateStatus('initialization', 'IN_PROGRESS');
        
        // 실제 구현 시에는 마이그레이션 후 아래 주석을 해제하세요
        /*
        // 제안 존재 및 상태 확인
        const proposal = await prisma.dAOProposal.findUnique({
          where: { proposalId: Number(proposalId) }
        });
        
        if (!proposal) {
          await updateStatus('initialization', 'ERROR', { error: '제안을 찾을 수 없습니다' });
          throw new Error('제안을 찾을 수 없습니다');
        }
        
        if (proposal.status === 'CLOSED') {
          await updateStatus('initialization', 'ERROR', { error: '이미 종료된 제안입니다' });
          throw new Error('이미 종료된 제안입니다');
        }
        */
        
        await updateStatus('initialization', 'COMPLETED');
        
        // RPC 공급자 설정
        await updateStatus('providerSetup', 'IN_PROGRESS');
        let provider;
        try {
          provider = await setupRpcProvider();
          await updateStatus('providerSetup', 'COMPLETED');
        } catch (providerError) {
          const errorMessage = providerError instanceof Error ? providerError.message : '알 수 없는 오류';
          await updateStatus('providerSetup', 'ERROR', { error: errorMessage });
          throw new Error(`RPC 공급자 설정 실패: ${errorMessage}`);
        }
        
        // 컨트랙트 연결
        await updateStatus('contractSetup', 'IN_PROGRESS');
        const wallet = new ethers.Wallet(CONTRACT_PRIVATE_KEY, provider);
        const daoContract = new ethers.Contract(
          DAO_CONTRACT_ADDRESS,
          DAOABI,
          wallet
        );
        await updateStatus('contractSetup', 'COMPLETED', {
          contractAddress: DAO_CONTRACT_ADDRESS,
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
          gasLimit: 300000,
        };
        
        // 가스 가격 설정 및 논스 설정 (생략)
        await updateStatus('gasEstimation', 'COMPLETED');
        await updateStatus('nonceSetup', 'COMPLETED');
        
        // 트랜잭션 전송 - 재시도 로직 포함
        await updateStatus('transaction', 'IN_PROGRESS', { attempts: 0, maxAttempts: 3 });
        let attemptCount = 0;
        const maxAttempts = 3;
        let lastError: Error | null = null;
        
        while (attemptCount < maxAttempts) {
          try {
            attemptCount++;
            await updateStatus('transaction', 'IN_PROGRESS', { attempts: attemptCount });
            
            console.log(`[${requestId}] 트랜잭션 준비 - 제안 ID: ${proposalId} 종료`);
            await updateStatus('transaction', 'IN_PROGRESS', { 
              startTime: new Date().toISOString(),
              message: '트랜잭션을 블록체인에 제출 중...' 
            });

            // 트랜잭션 제출 (타임아웃 30초)
            const txPromise = daoContract.closeProposal(proposalId, options);
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('타임아웃: 트랜잭션 제출이 30초 이상 소요되고 있습니다')), 30000);
            });

            let tx;
            let hasTimedOut = false;

            try {
              tx = await Promise.race([txPromise, timeoutPromise]);
            } catch (timeoutError: unknown) {
              if (timeoutError instanceof Error && timeoutError.message.includes('타임아웃')) {
                hasTimedOut = true;
                await updateStatus('transaction', 'IN_PROGRESS', { 
                  warning: '트랜잭션 제출이 지연되고 있습니다. 백그라운드에서 계속 진행 중입니다.'
                });
                
                tx = await txPromise;
              } else {
                throw timeoutError;
              }
            }

            const txHash = tx.hash;
            await updateStatus('transaction', 'COMPLETED', { 
              txHash,
              blockExplorerLink: `${process.env.BLOCK_EXPLORER_URL || 'https://sepolia.etherscan.io'}/tx/${txHash}`,
              message: hasTimedOut ? '지연된 트랜잭션이 제출되었습니다.' : '트랜잭션이 성공적으로 제출되었습니다.' 
            });
            
            await updateStatus('confirmation', 'IN_PROGRESS', {
              txHash,
              startTime: new Date().toISOString()
            });
            
            // 블록 확인 (간략하게 처리)
            const receipt = await tx.wait();
            
            await updateStatus('confirmation', 'COMPLETED', {
              blockNumber: receipt.blockNumber,
              gasUsed: receipt.gasUsed.toString(),
              blockExplorerLink: `${process.env.BLOCK_EXPLORER_URL || 'https://sepolia.etherscan.io'}/tx/${tx.hash}`
            });
            
            // 데이터베이스 업데이트 (마이그레이션 후 주석 해제)
            /*
            await prisma.dAOProposal.update({
              where: { proposalId: Number(proposalId) },
              data: {
                status: 'CLOSED',
                closedAt: new Date()
              }
            });
            */
            
            break; // 성공 시 반복문 종료
          } catch (txError) {
            lastError = txError instanceof Error ? txError : new Error(String(txError));
            
            await updateStatus('transaction', 'IN_PROGRESS', {
              attempts: attemptCount,
              error: lastError.message,
              status: attemptCount < maxAttempts ? 'RETRY' : 'ERROR'
            });
            
            if (attemptCount < maxAttempts) {
              const delayMs = 2000 * Math.pow(2, attemptCount - 1);
              await new Promise(resolve => setTimeout(resolve, delayMs));
            }
          }
        }
        
        if (attemptCount === maxAttempts && lastError) {
          await updateStatus('transaction', 'ERROR', { 
            error: lastError.message, 
            attempts: attemptCount,
            maxAttempts: maxAttempts
          });
          throw lastError;
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        console.error(`[${requestId}] 백그라운드 처리 중 최종 오류:`, errorMessage);
        txPipeline.status = 'ERROR';
        txPipeline.error = errorMessage;
      } finally {
        console.timeEnd('비동기 DAO 제안 종료 요청 처리');
      }
    };
    
    // 비동기 처리 시작
    processClose().catch(error => {
      console.error(`[${requestId}] processClose 에러:`, error);
    });
    
  } catch (error) {
    console.error(`DAO 제안 종료 요청 처리 오류:`, error);
    console.timeEnd('비동기 DAO 제안 종료 요청 처리');
    
    if (!res.headersSent) {
      if (error instanceof Error) {
        res.status(500).json({ error: 'DAO 제안 종료 요청 처리 중 오류가 발생했습니다: ' + error.message });
      } else {
        res.status(500).json({ error: 'DAO 제안 종료 요청 처리 중 알 수 없는 오류가 발생했습니다' });
      }
    }
  }
});

// 비동기 트랜잭션에서 생성된 requestId 목록을 반환하는 엔드포인트 (디버깅/테스트용)
/**
 * @swagger
 * /api/dao/requests:
 *   get:
 *     summary: 비동기 DAO 트랜잭션 요청 목록 조회
 *     description: 비동기로 처리 중인 모든 DAO 트랜잭션 요청 목록을 조회합니다. (테스트 및 디버깅용)
 *     tags: [DAO]
 *     responses:
 *       200:
 *         description: 트랜잭션 요청 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       requestId:
 *                         type: string
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       txHash:
 *                         type: string
 *       500:
 *         description: 서버 오류
 */
router.get('/requests', (req: Request, res: Response) => {
  try {
    const requests = Array.from(transactionPipelines.values()).map(pipeline => ({
      requestId: pipeline.requestId,
      status: pipeline.status,
      createdAt: pipeline.createdAt,
      proposalId: pipeline.proposalId,
      txHash: pipeline.txHash
    }));
    
    res.json({ requests });
  } catch (error) {
    console.error('트랜잭션 요청 목록 조회 오류:', error);
    res.status(500).json({ error: '트랜잭션 요청 목록 조회 중 오류가 발생했습니다' });
  }
});

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