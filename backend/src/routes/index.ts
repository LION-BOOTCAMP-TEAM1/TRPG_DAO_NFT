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


const router = express.Router();

// 로깅 미들웨어
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

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
// 관리자 시드 API 엔드포인트
const seedHandler = async (req: Request, res: Response) => {
  try {
    const apiKey = req.headers['x-api-key'];
    // 환경 변수에서 API 키 확인 (보안을 위해 환경 변수 사용)
    const validApiKey = process.env.ADMIN_API_KEY || 'tR3P6-4dM1n-K3y'; // 기본값은 배포 전에 변경해야 함
    
    if (apiKey !== validApiKey) {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }
    
    console.log('시드 데이터 적용 시작...');
    await seedDatabase();
    console.log('시드 데이터 적용 완료!');
    
    return res.status(200).json({ success: true, message: '시드 데이터가 성공적으로 적용되었습니다.' });
  } catch (error: any) {
    console.error('시드 적용 중 오류 발생:', error);
    return res.status(500).json({ 
      success: false, 
      error: '시드 데이터 적용 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

/**
 * @swagger
 * /admin/seed/genres:
 *   post:
 *     tags:
 *       - Admin
 *     summary: 장르 시드 데이터를 적용합니다.
 *     description: 관리자 전용 API로, 장르 시드 데이터를 적용합니다.
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: 장르 시드 데이터가 성공적으로 적용됨
 *       403:
 *         description: 접근 권한 없음
 *       500:
 *         description: 서버 오류
 */
const seedGenresHandler = async (req: Request, res: Response) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.ADMIN_API_KEY || 'tR3P6-4dM1n-K3y';
    
    if (apiKey !== validApiKey) {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }
    
    console.log('장르 시드 데이터 적용 시작...');
    await seedGenres();
    console.log('장르 시드 데이터 적용 완료!');
    
    return res.status(200).json({ success: true, message: '장르 시드 데이터가 성공적으로 적용되었습니다.' });
  } catch (error: any) {
    console.error('장르 시드 적용 중 오류 발생:', error);
    return res.status(500).json({ 
      success: false, 
      error: '장르 시드 데이터 적용 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

/**
 * @swagger
 * /admin/seed/storyworlds:
 *   post:
 *     tags:
 *       - Admin
 *     summary: 스토리 세계관 시드 데이터를 적용합니다.
 *     description: 관리자 전용 API로, 스토리 세계관 시드 데이터를 적용합니다.
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: 스토리 세계관 시드 데이터가 성공적으로 적용됨
 *       403:
 *         description: 접근 권한 없음
 *       500:
 *         description: 서버 오류
 */
const seedStoryWorldsHandler = async (req: Request, res: Response) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.ADMIN_API_KEY || 'tR3P6-4dM1n-K3y';
    
    if (apiKey !== validApiKey) {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }
    
    console.log('스토리 세계관 시드 데이터 적용 시작...');
    await seedStoryWorlds();
    console.log('스토리 세계관 시드 데이터 적용 완료!');
    
    return res.status(200).json({ success: true, message: '스토리 세계관 시드 데이터가 성공적으로 적용되었습니다.' });
  } catch (error: any) {
    console.error('스토리 세계관 시드 적용 중 오류 발생:', error);
    return res.status(500).json({ 
      success: false, 
      error: '스토리 세계관 시드 데이터 적용 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

/**
 * @swagger
 * /admin/seed/chapters:
 *   post:
 *     tags:
 *       - Admin
 *     summary: 챕터 시드 데이터를 적용합니다.
 *     description: 관리자 전용 API로, 챕터 시드 데이터를 적용합니다.
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: 챕터 시드 데이터가 성공적으로 적용됨
 *       403:
 *         description: 접근 권한 없음
 *       500:
 *         description: 서버 오류
 */
const seedChaptersHandler = async (req: Request, res: Response) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.ADMIN_API_KEY || 'tR3P6-4dM1n-K3y';
    
    if (apiKey !== validApiKey) {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }
    
    console.log('챕터 시드 데이터 적용 시작...');
    await seedChapters();
    console.log('챕터 시드 데이터 적용 완료!');
    
    return res.status(200).json({ success: true, message: '챕터 시드 데이터가 성공적으로 적용되었습니다.' });
  } catch (error: any) {
    console.error('챕터 시드 적용 중 오류 발생:', error);
    return res.status(500).json({ 
      success: false, 
      error: '챕터 시드 데이터 적용 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

/**
 * @swagger
 * /admin/seed/quests:
 *   post:
 *     tags:
 *       - Admin
 *     summary: 퀘스트 시드 데이터를 적용합니다.
 *     description: 관리자 전용 API로, 퀘스트 시드 데이터를 적용합니다.
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: 퀘스트 시드 데이터가 성공적으로 적용됨
 *       403:
 *         description: 접근 권한 없음
 *       500:
 *         description: 서버 오류
 */
const seedQuestsHandler = async (req: Request, res: Response) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.ADMIN_API_KEY || 'tR3P6-4dM1n-K3y';
    
    if (apiKey !== validApiKey) {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }
    
    console.log('퀘스트 시드 데이터 적용 시작...');
    await seedQuests();
    console.log('퀘스트 시드 데이터 적용 완료!');
    
    return res.status(200).json({ success: true, message: '퀘스트 시드 데이터가 성공적으로 적용되었습니다.' });
  } catch (error: any) {
    console.error('퀘스트 시드 적용 중 오류 발생:', error);
    return res.status(500).json({ 
      success: false, 
      error: '퀘스트 시드 데이터 적용 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

/**
 * @swagger
 * /admin/seed/choices:
 *   post:
 *     tags:
 *       - Admin
 *     summary: 선택지 시드 데이터를 적용합니다.
 *     description: 관리자 전용 API로, 선택지 시드 데이터를 적용합니다.
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: 선택지 시드 데이터가 성공적으로 적용됨
 *       403:
 *         description: 접근 권한 없음
 *       500:
 *         description: 서버 오류
 */
const seedChoicesHandler = async (req: Request, res: Response) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.ADMIN_API_KEY || 'tR3P6-4dM1n-K3y';
    
    if (apiKey !== validApiKey) {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }
    
    console.log('선택지 시드 데이터 적용 시작...');
    await seedChoices();
    console.log('선택지 시드 데이터 적용 완료!');
    
    return res.status(200).json({ success: true, message: '선택지 시드 데이터가 성공적으로 적용되었습니다.' });
  } catch (error: any) {
    console.error('선택지 시드 적용 중 오류 발생:', error);
    return res.status(500).json({ 
      success: false, 
      error: '선택지 시드 데이터 적용 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

/**
 * @swagger
 * /admin/seed/storyscenes:
 *   post:
 *     tags:
 *       - Admin
 *     summary: 스토리 씬 시드 데이터를 적용합니다.
 *     description: 관리자 전용 API로, 스토리 씬 시드 데이터를 적용합니다.
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: 스토리 씬 시드 데이터가 성공적으로 적용됨
 *       403:
 *         description: 접근 권한 없음
 *       500:
 *         description: 서버 오류
 */
const seedStoryScenesHandler = async (req: Request, res: Response) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.ADMIN_API_KEY || 'tR3P6-4dM1n-K3y';
    
    if (apiKey !== validApiKey) {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }
    
    console.log('스토리 씬 시드 데이터 적용 시작...');
    await seedStoryScenes();
    console.log('스토리 씬 시드 데이터 적용 완료!');
    
    return res.status(200).json({ success: true, message: '스토리 씬 시드 데이터가 성공적으로 적용되었습니다.' });
  } catch (error: any) {
    console.error('스토리 씬 시드 적용 중 오류 발생:', error);
    return res.status(500).json({ 
      success: false, 
      error: '스토리 씬 시드 데이터 적용 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

/**
 * @swagger
 * /admin/seed/branchpoints:
 *   post:
 *     tags:
 *       - Admin
 *     summary: 브랜치 포인트 시드 데이터를 적용합니다.
 *     description: 관리자 전용 API로, 브랜치 포인트 시드 데이터를 적용합니다.
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: 브랜치 포인트 시드 데이터가 성공적으로 적용됨
 *       403:
 *         description: 접근 권한 없음
 *       500:
 *         description: 서버 오류
 */
const seedBranchPointsHandler = async (req: Request, res: Response) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.ADMIN_API_KEY || 'tR3P6-4dM1n-K3y';
    
    if (apiKey !== validApiKey) {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }
    
    console.log('브랜치 포인트 시드 데이터 적용 시작...');
    await seedBranchPoints();
    console.log('브랜치 포인트 시드 데이터 적용 완료!');
    
    return res.status(200).json({ success: true, message: '브랜치 포인트 시드 데이터가 성공적으로 적용되었습니다.' });
  } catch (error: any) {
    console.error('브랜치 포인트 시드 적용 중 오류 발생:', error);
    return res.status(500).json({ 
      success: false, 
      error: '브랜치 포인트 시드 데이터 적용 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

/**
 * @swagger
 * /admin/seed/branchpointscenes:
 *   post:
 *     tags:
 *       - Admin
 *     summary: 브랜치 포인트 씬 시드 데이터를 적용합니다.
 *     description: 관리자 전용 API로, 브랜치 포인트 씬 시드 데이터를 적용합니다.
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: 브랜치 포인트 씬 시드 데이터가 성공적으로 적용됨
 *       403:
 *         description: 접근 권한 없음
 *       500:
 *         description: 서버 오류
 */
const seedBranchPointScenesHandler = async (req: Request, res: Response) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.ADMIN_API_KEY || 'tR3P6-4dM1n-K3y';
    
    if (apiKey !== validApiKey) {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }
    
    console.log('브랜치 포인트 씬 시드 데이터 적용 시작...');
    await seedBranchPointScenes();
    console.log('브랜치 포인트 씬 시드 데이터 적용 완료!');
    
    return res.status(200).json({ success: true, message: '브랜치 포인트 씬 시드 데이터가 성공적으로 적용되었습니다.' });
  } catch (error: any) {
    console.error('브랜치 포인트 씬 시드 적용 중 오류 발생:', error);
    return res.status(500).json({ 
      success: false, 
      error: '브랜치 포인트 씬 시드 데이터 적용 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

/**
 * @swagger
 * /admin/seed/daochoices:
 *   post:
 *     tags:
 *       - Admin
 *     summary: DAO 선택지 시드 데이터를 적용합니다.
 *     description: 관리자 전용 API로, DAO 선택지 시드 데이터를 적용합니다.
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: DAO 선택지 시드 데이터가 성공적으로 적용됨
 *       403:
 *         description: 접근 권한 없음
 *       500:
 *         description: 서버 오류
 */
const seedDAOChoicesHandler = async (req: Request, res: Response) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.ADMIN_API_KEY || 'tR3P6-4dM1n-K3y';
    
    if (apiKey !== validApiKey) {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }
    
    console.log('DAO 선택지 시드 데이터 적용 시작...');
    await seedDAOChoices();
    console.log('DAO 선택지 시드 데이터 적용 완료!');
    
    return res.status(200).json({ success: true, message: 'DAO 선택지 시드 데이터가 성공적으로 적용되었습니다.' });
  } catch (error: any) {
    console.error('DAO 선택지 시드 적용 중 오류 발생:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'DAO 선택지 시드 데이터 적용 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

/**
 * @swagger
 * /admin/seed/items:
 *   post:
 *     tags:
 *       - Admin
 *     summary: 아이템 시드 데이터를 적용합니다.
 *     description: 관리자 전용 API로, 아이템 시드 데이터를 적용합니다.
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: 아이템 시드 데이터가 성공적으로 적용됨
 *       403:
 *         description: 접근 권한 없음
 *       500:
 *         description: 서버 오류
 */
const seedItemsHandler = async (req: Request, res: Response) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.ADMIN_API_KEY || 'tR3P6-4dM1n-K3y';
    
    if (apiKey !== validApiKey) {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }
    
    console.log('아이템 시드 데이터 적용 시작...');
    await seedItems();
    console.log('아이템 시드 데이터 적용 완료!');
    
    return res.status(200).json({ success: true, message: '아이템 시드 데이터가 성공적으로 적용되었습니다.' });
  } catch (error: any) {
    console.error('아이템 시드 적용 중 오류 발생:', error);
    return res.status(500).json({ 
      success: false, 
      error: '아이템 시드 데이터 적용 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

/**
 * @swagger
 * /admin/seed/choiceconditions:
 *   post:
 *     tags:
 *       - Admin
 *     summary: 선택지 조건 시드 데이터를 적용합니다.
 *     description: 관리자 전용 API로, 선택지 조건 시드 데이터를 적용합니다.
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: 선택지 조건 시드 데이터가 성공적으로 적용됨
 *       403:
 *         description: 접근 권한 없음
 *       500:
 *         description: 서버 오류
 */
const seedChoiceConditionsHandler = async (req: Request, res: Response) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.ADMIN_API_KEY || 'tR3P6-4dM1n-K3y';
    
    if (apiKey !== validApiKey) {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }
    
    console.log('선택지 조건 시드 데이터 적용 시작...');
    await seedChoiceConditions();
    console.log('선택지 조건 시드 데이터 적용 완료!');
    
    return res.status(200).json({ success: true, message: '선택지 조건 시드 데이터가 성공적으로 적용되었습니다.' });
  } catch (error: any) {
    console.error('선택지 조건 시드 적용 중 오류 발생:', error);
    return res.status(500).json({ 
      success: false, 
      error: '선택지 조건 시드 데이터 적용 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

/**
 * @swagger
 * /admin/seed/rewards:
 *   post:
 *     tags:
 *       - Admin
 *     summary: 보상 시드 데이터를 적용합니다.
 *     description: 관리자 전용 API로, 보상 시드 데이터를 적용합니다.
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: 보상 시드 데이터가 성공적으로 적용됨
 *       403:
 *         description: 접근 권한 없음
 *       500:
 *         description: 서버 오류
 */
const seedRewardsHandler = async (req: Request, res: Response) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.ADMIN_API_KEY || 'tR3P6-4dM1n-K3y';
    
    if (apiKey !== validApiKey) {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }
    
    console.log('보상 시드 데이터 적용 시작...');
    await seedRewards();
    console.log('보상 시드 데이터 적용 완료!');
    
    return res.status(200).json({ success: true, message: '보상 시드 데이터가 성공적으로 적용되었습니다.' });
  } catch (error: any) {
    console.error('보상 시드 적용 중 오류 발생:', error);
    return res.status(500).json({ 
      success: false, 
      error: '보상 시드 데이터 적용 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

// 타입 문제로 인해 어설션 사용
(router as any).post('/admin/seed', seedHandler);
(router as any).post('/admin/seed/genres', seedGenresHandler);
(router as any).post('/admin/seed/storyworlds', seedStoryWorldsHandler);
(router as any).post('/admin/seed/chapters', seedChaptersHandler);
(router as any).post('/admin/seed/quests', seedQuestsHandler);
(router as any).post('/admin/seed/choices', seedChoicesHandler);
(router as any).post('/admin/seed/storyscenes', seedStoryScenesHandler);
(router as any).post('/admin/seed/branchpoints', seedBranchPointsHandler);
(router as any).post('/admin/seed/branchpointscenes', seedBranchPointScenesHandler);
(router as any).post('/admin/seed/daochoices', seedDAOChoicesHandler);
(router as any).post('/admin/seed/items', seedItemsHandler);
(router as any).post('/admin/seed/choiceconditions', seedChoiceConditionsHandler);
(router as any).post('/admin/seed/rewards', seedRewardsHandler);

// 각 리소스별 라우터 등록
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


export default router;
