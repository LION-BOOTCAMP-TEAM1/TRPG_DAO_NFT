import express from 'express';
import userRoutes from './users';
import characterRoutes from './characters';
import characterClassRoutes from './characterclasses';
import storyRoutes from './stories';
import questRoutes from './quests';
import branchpointRoutes from './branchpoints';
import daoRoutes from './dao';
import sessionRoutes from './sessions';
import playerNftRoutes from './playernfts';

const router = express.Router();

// 로깅 미들웨어
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

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

export default router;
