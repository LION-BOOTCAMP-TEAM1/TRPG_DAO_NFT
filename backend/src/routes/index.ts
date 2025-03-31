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
import { seedGenres, seedStoryWorlds } from '../seed/seed';


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

// 타입 문제로 인해 어설션 사용
(router as any).post('/admin/seed', seedHandler);
(router as any).post('/admin/seed/genres', seedGenresHandler);
(router as any).post('/admin/seed/storyworlds', seedStoryWorldsHandler);

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
