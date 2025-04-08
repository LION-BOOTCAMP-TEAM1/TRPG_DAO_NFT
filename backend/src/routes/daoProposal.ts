import express, { Request, Response } from 'express';
import { ethers } from 'ethers';
import DAOABI from '../utils/abis/DAO.json';
import prisma from '../prismaClient';

const router = express.Router();

// Provider 설정
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const DAO_CONTRACT_ADDRESS = process.env.DAO_CONTRACT_ADDRESS || '0x0';

/**
 * @swagger
 * /api/dao/proposals:
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
 * /api/dao/proposals/{proposalId}:
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
 * /api/dao/proposals:
 *   post:
 *     summary: 새 DAO 제안 생성
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
 *               - privateKey
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
 *               privateKey:
 *                 type: string
 *                 description: 트랜잭션 서명에 사용할 개인키
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
router.post('/', async (req: Request, res: Response) => {
  try {
    const { description, duration, numOptions, users, privateKey } = req.body;
    
    // 요청 검증
    if (!description || !duration || !numOptions || !users || !privateKey) {
      return res.status(400).json({ error: '필수 정보가 누락되었습니다' });
    }
    
    // 트랜잭션 처리를 위한 서명자 생성
    const wallet = new ethers.Wallet(privateKey, provider);
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
 * /api/dao/proposals/{proposalId}/close:
 *   post:
 *     summary: DAO 제안 종료
 *     description: 특정 DAO 제안을 종료합니다. 블록체인에 트랜잭션을 전송합니다.
 *     tags: [DAO]
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 종료할 제안의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - privateKey
 *             properties:
 *               privateKey:
 *                 type: string
 *                 description: 트랜잭션 서명에 사용할 개인키
 *     responses:
 *       200:
 *         description: 제안 종료 성공
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
 *         description: 잘못된 요청 또는 이미 종료된 제안
 *       404:
 *         description: 제안을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.post('/:proposalId/close', async (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params;
    const { privateKey } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ error: '프라이빗 키가 필요합니다' });
    }
    
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
    const wallet = new ethers.Wallet(privateKey, provider);
    const daoContract = new ethers.Contract(
      DAO_CONTRACT_ADDRESS,
      DAOABI,
      wallet
    );
    
    const tx = await daoContract.closeProposal(proposalId);
    const receipt = await tx.wait();
    
    res.json({
      success: true,
      message: '제안이 성공적으로 종료되었습니다',
      transactionHash: receipt.transactionHash
    });
  } catch (error) {
    console.error('DAO 제안 종료 오류:', error);
    res.status(500).json({ error: '제안 종료 중 오류가 발생했습니다' });
  }
});

export default router; 