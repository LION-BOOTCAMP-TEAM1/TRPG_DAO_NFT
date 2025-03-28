import express, { Request, Response, RequestHandler } from 'express';
import prisma from '../prismaClient';

const router = express.Router();

/**
 * @swagger
 * /api/dao/choices/{branchPointId}:
 *   get:
 *     summary: 특정 분기점의 DAO 선택지 목록을 조회합니다
 *     tags: [DAO]
 *     parameters:
 *       - in: path
 *         name: branchPointId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 분기점 ID
 *     responses:
 *       200:
 *         description: DAO 선택지 목록을 반환합니다
 *       404:
 *         description: 분기점을 찾을 수 없습니다
 *       500:
 *         description: 서버 오류
 */
const getDAOChoices = async (req: Request, res: Response) => {
  const { branchPointId } = req.params;

  try {
    // 유효한 분기점인지 확인
    const branchPoint = await prisma.branchPoint.findUnique({
      where: { id: Number(branchPointId) }
    });

    if (!branchPoint) {
      return res.status(404).json({ error: '분기점을 찾을 수 없습니다' });
    }

    // 해당 분기점의 DAO 선택지 조회
    const daoChoices = await prisma.dAOChoice.findMany({
      where: { branchPointId: Number(branchPointId) },
      orderBy: { id: 'asc' }
    });

    // 각 DAOChoice에 nextStorySlug 추가 처리
    if (daoChoices && daoChoices.length > 0) {
      // 모든 nextStoryId를 수집
      const storyIds = daoChoices.map(choice => choice.nextStoryId);
      
      // 관련된 모든 스토리를 한 번의 쿼리로 가져오기
      const stories = await prisma.story.findMany({
        where: { id: { in: storyIds } },
        select: { id: true, slug: true }
      });
      
      // ID를 키로 사용하는 맵 생성
      const storyMap = new Map(stories.map(story => [story.id, story.slug]));
      
      // 각 선택지에 nextStorySlug 추가
      const enhancedChoices = daoChoices.map(choice => ({
        ...choice,
        nextStorySlug: storyMap.get(choice.nextStoryId) || null
      }));
      
      // 업데이트된 선택지 반환
      return res.json(enhancedChoices);
    }

    res.json(daoChoices);
  } catch (error) {
    console.error('DAO 선택지 조회 오류:', error);
    res.status(500).json({ error: 'DAO 선택지 조회 중 오류가 발생했습니다' });
  }
};

/**
 * @swagger
 * /api/dao/vote:
 *   post:
 *     summary: DAO 선택지에 투표합니다
 *     tags: [DAO]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - choiceId
 *               - walletAddress
 *             properties:
 *               choiceId:
 *                 type: integer
 *                 description: 투표할 DAO 선택지 ID
 *               walletAddress:
 *                 type: string
 *                 description: 투표자 지갑 주소
 *     responses:
 *       200:
 *         description: 투표 성공
 *       400:
 *         description: 잘못된 요청 (필수 정보 누락)
 *       404:
 *         description: 선택지를 찾을 수 없음
 *       409:
 *         description: 이미 닫힌 투표 또는 다른 충돌 상황
 *       500:
 *         description: 서버 오류
 */
const voteForDAOChoice = async (req: Request, res: Response) => {
  const { choiceId, walletAddress } = req.body;

  if (!choiceId || !walletAddress) {
    return res.status(400).json({ error: '선택지 ID와 지갑 주소가 필요합니다' });
  }

  try {
    // 유효한 선택지인지 확인
    const choice = await prisma.dAOChoice.findUnique({
      where: { id: Number(choiceId) },
      include: { branchPoint: true }
    });

    if (!choice) {
      return res.status(404).json({ error: '선택지를 찾을 수 없습니다' });
    }

    // 분기점이 아직 열려있는지 확인
    if (choice.branchPoint.status !== 'OPEN') {
      return res.status(409).json({ error: '이미 닫힌 투표입니다' });
    }

    // 유효한 사용자인지 확인
    const user = await prisma.user.findUnique({
      where: { walletAddress }
    });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    // 투표 수 증가 (실제 애플리케이션에서는 중복 투표 방지 로직이 필요)
    await prisma.dAOChoice.update({
      where: { id: Number(choiceId) },
      data: { voteCount: { increment: 1 } }
    });

    res.json({ success: true, message: '투표가 성공적으로 처리되었습니다' });
  } catch (error) {
    console.error('DAO 투표 오류:', error);
    res.status(500).json({ error: 'DAO 투표 처리 중 오류가 발생했습니다' });
  }
};

/**
 * @swagger
 * /api/dao/close/{branchPointId}:
 *   post:
 *     summary: DAO 투표를 마감하고 결과를 처리합니다
 *     tags: [DAO]
 *     parameters:
 *       - in: path
 *         name: branchPointId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 분기점 ID
 *     responses:
 *       200:
 *         description: 투표 마감 및 결과 처리 성공
 *       404:
 *         description: 분기점을 찾을 수 없음
 *       409:
 *         description: 이미 닫힌 투표
 *       500:
 *         description: 서버 오류
 */
const closeDAOVoting = async (req: Request, res: Response) => {
  const { branchPointId } = req.params;

  try {
    // 유효한 분기점인지 확인
    const branchPoint = await prisma.branchPoint.findUnique({
      where: { id: Number(branchPointId) },
      include: { DAOChoice: true }
    });

    if (!branchPoint) {
      return res.status(404).json({ error: '분기점을 찾을 수 없습니다' });
    }

    // 이미 닫힌 투표인지 확인
    if (branchPoint.status === 'CLOSED') {
      return res.status(409).json({ error: '이미 닫힌 투표입니다' });
    }

    // 가장 많은 투표를 받은 선택지 찾기
    const winningChoice = branchPoint.DAOChoice.reduce((prev, current) => 
      (prev.voteCount > current.voteCount) ? prev : current
    );

    // 분기점 업데이트: 상태를 CLOSED로 변경하고 결과 선택지 설정
    await prisma.branchPoint.update({
      where: { id: Number(branchPointId) },
      data: {
        status: 'CLOSED',
        resultChoiceId: winningChoice.id
      }
    });

    res.json({
      success: true,
      message: '투표가 마감되었습니다',
      result: {
        winningChoice: winningChoice
      }
    });
  } catch (error) {
    console.error('DAO 투표 마감 오류:', error);
    res.status(500).json({ error: 'DAO 투표 마감 중 오류가 발생했습니다' });
  }
};

// 라우터에 핸들러 연결
router.get('/choices/:branchPointId', getDAOChoices as RequestHandler);
router.post('/vote', voteForDAOChoice as RequestHandler);
router.post('/close/:branchPointId', closeDAOVoting as RequestHandler);

export default router; 