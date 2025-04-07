import express, { Request, Response } from 'express';
import { ethers } from 'ethers';
import DAOABI from '../../../frontend/src/utils/abis/DAO.json';
import prisma from '../prismaClient';

const router = express.Router();

// Provider 설정
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const DAO_CONTRACT_ADDRESS = process.env.DAO_CONTRACT_ADDRESS || '0x0';

/**
 * DAO 제안 목록 조회
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
 * 특정 DAO 제안 상세 조회
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
 * 새 DAO 제안 생성
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
 * DAO 제안 종료
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