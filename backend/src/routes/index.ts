import express, { Request, Response } from 'express';
import userRoutes from './users';
import characterRoutes from './characters';
import characterClassRoutes from './characterclasses';
import storyRoutes from './stories';
import questRoutes from './quests';
import branchpointRoutes from './branchpoints';
import daoRoutes from './dao';
import sessionRoutes from './sessions';
import playerNftRoutes from './playernfts';
import storyWorldRoutes from './storyWorlds';
import chapterRoutes from './chapters';
import authRoutes from './auth';
import { seedDatabase } from '../seed/seed';
// 개별 시드 함수들 가져오기
import { 
  seedGenres, 
  seedStoryWorlds, 
  seedChapters, 
  seedQuests, 
  seedChoices, 
  seedStoryScenes, 
  seedBranchPoints, 
  seedBranchPointScenes,
  seedDAOChoices,
  seedItems,
  seedChoiceConditions,
  seedRewards 
} from '../seed/seed';
import { setupEventListeners } from '../services/blockchainSync';
import daoProposalRouter from './daoProposal';
import { setupNFTEventListeners, startNFTProcessingSchedule } from '../services/nftService';
import nftRouter from './nft';


const router = express.Router();

// 로깅 미들웨어
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// API 키 검증 미들웨어
function validateApiKey(req: Request, res: Response, next: Function) {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.ADMIN_API_KEY || 'tR3P6-4dM1n-K3y'; // 기본값은 배포 전에 변경해야 함
  
  if (apiKey !== validApiKey) {
    return res.status(403).json({ error: '접근 권한이 없습니다.' });
  }
  
  next();
}

// 시드 함수를 실행하는 일반화된 핸들러 생성
function createSeedHandler(seedFn: Function, seedName: string) {
  return async (req: Request, res: Response) => {
    try {
      console.log(`${seedName} 시드 데이터 적용 시작...`);
      await seedFn();
      console.log(`${seedName} 시드 데이터 적용 완료!`);
      
      return res.status(200).json({ 
        success: true, 
        message: `${seedName} 시드 데이터가 성공적으로 적용되었습니다.` 
      });
    } catch (error: any) {
      console.error(`${seedName} 시드 적용 중 오류 발생:`, error);
      return res.status(500).json({ 
        success: false, 
        error: `${seedName} 시드 데이터 적용 중 오류가 발생했습니다.`,
        details: error.message 
      });
    }
  };
}

/**
 * @swagger
 * /admin/seed:
 *   post:
 *     tags:
 *       - Admin
 *     summary: 데이터베이스에 시드 데이터를 적용합니다.
 *     description: 관리자 전용 API로, 데이터베이스에 기본 시드 데이터를 적용합니다.
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: 시드 데이터가 성공적으로 적용됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 시드 데이터가 성공적으로 적용되었습니다.
 *       403:
 *         description: 접근 권한 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 접근 권한이 없습니다.
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: 시드 데이터 적용 중 오류가 발생했습니다.
 *                 details:
 *                   type: string
 *                   example: Error message details
 */

// 시드 관련 라우트 설정
router.post('/admin/seed', validateApiKey, createSeedHandler(seedDatabase, '전체'));
router.post('/admin/seed/genres', validateApiKey, createSeedHandler(seedGenres, '장르'));
router.post('/admin/seed/storyworlds', validateApiKey, createSeedHandler(seedStoryWorlds, '스토리 세계관'));
router.post('/admin/seed/chapters', validateApiKey, createSeedHandler(seedChapters, '챕터'));
router.post('/admin/seed/quests', validateApiKey, createSeedHandler(seedQuests, '퀘스트'));
router.post('/admin/seed/choices', validateApiKey, createSeedHandler(seedChoices, '선택지'));
router.post('/admin/seed/storyscenes', validateApiKey, createSeedHandler(seedStoryScenes, '스토리 씬'));
router.post('/admin/seed/branchpoints', validateApiKey, createSeedHandler(seedBranchPoints, '브랜치 포인트'));
router.post('/admin/seed/branchpointscenes', validateApiKey, createSeedHandler(seedBranchPointScenes, '브랜치 포인트 씬'));
router.post('/admin/seed/daochoices', validateApiKey, createSeedHandler(seedDAOChoices, 'DAO 선택지'));
router.post('/admin/seed/items', validateApiKey, createSeedHandler(seedItems, '아이템'));
router.post('/admin/seed/choiceconditions', validateApiKey, createSeedHandler(seedChoiceConditions, '선택지 조건'));
router.post('/admin/seed/rewards', validateApiKey, createSeedHandler(seedRewards, '보상'));

// 각 리소스별 라우터 등록
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/characters', characterRoutes);
router.use('/characterclasses', characterClassRoutes);
router.use('/stories', storyRoutes);
router.use('/quests', questRoutes);
router.use('/branchpoints', branchpointRoutes);
router.use('/dao', daoRoutes);
router.use('/sessions', sessionRoutes);
router.use('/playernfts', playerNftRoutes);
router.use('/story-worlds', storyWorldRoutes);
router.use('/chapters', chapterRoutes);

// DAO Proposal 라우터 등록
router.use('/api/proposals', daoProposalRouter);

// NFT 이벤트 리스너 설정 및 처리 스케줄 시작
setupNFTEventListeners();
startNFTProcessingSchedule();

// NFT API 라우터 등록
router.use('/api/nft', nftRouter);

export default router;
