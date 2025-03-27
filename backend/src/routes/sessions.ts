import express, { Request, Response, RequestHandler } from 'express';
import prisma from '../prismaClient';

const router = express.Router();

/**
 * @swagger
 * /api/sessions:
 *   get:
 *     summary: 모든 세션 목록을 조회합니다
 *     tags: [Sessions]
 *     responses:
 *       200:
 *         description: 세션 목록을 반환합니다
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: 서버 오류
 */
const getSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await prisma.session.findMany({
      include: {
        users: {
          select: {
            id: true,
            walletAddress: true
          }
        },
        progress: true
      }
    });
    
    res.json(sessions);
  } catch (error) {
    console.error('세션 목록 조회 오류:', error);
    res.status(500).json({ error: '세션 목록 조회 중 오류가 발생했습니다' });
  }
};

/**
 * @swagger
 * /api/sessions/{id}:
 *   get:
 *     summary: 특정 세션 정보를 조회합니다
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 세션 ID
 *     responses:
 *       200:
 *         description: 세션 정보를 반환합니다
 *       404:
 *         description: 세션을 찾을 수 없습니다
 *       500:
 *         description: 서버 오류
 */
const getSession = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const session = await prisma.session.findUnique({
      where: { id: Number(id) },
      include: {
        users: {
          select: {
            id: true,
            walletAddress: true,
            Character: {
              select: {
                id: true,
                name: true,
                class: true
              }
            }
          }
        },
        progress: {
          include: {
            story: true
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: '세션을 찾을 수 없습니다' });
    }

    res.json(session);
  } catch (error) {
    console.error('세션 조회 오류:', error);
    res.status(500).json({ error: '세션 조회 중 오류가 발생했습니다' });
  }
};

/**
 * @swagger
 * /api/sessions:
 *   post:
 *     summary: 새로운 세션을 생성합니다
 *     tags: [Sessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - userIds
 *               - storyId
 *             properties:
 *               name:
 *                 type: string
 *                 description: 세션 이름
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 참여 사용자 ID 목록
 *               storyId:
 *                 type: integer
 *                 description: 진행할 스토리 ID
 *     responses:
 *       201:
 *         description: 생성된 세션 정보를 반환합니다
 *       400:
 *         description: 잘못된 요청 (필수 정보 누락)
 *       404:
 *         description: 사용자 또는 스토리를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
const createSession = async (req: Request, res: Response) => {
  const { name, userIds, storyId } = req.body;

  if (!name || !userIds || userIds.length === 0 || !storyId) {
    return res.status(400).json({ error: '세션 이름, 참여 사용자, 스토리 정보가 필요합니다' });
  }

  try {
    // 유효한 사용자인지 확인
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds }
      }
    });

    if (users.length !== userIds.length) {
      return res.status(404).json({ error: '일부 사용자를 찾을 수 없습니다' });
    }

    // 유효한 스토리인지 확인
    const story = await prisma.story.findUnique({
      where: { id: Number(storyId) },
      include: { quests: { take: 1 } }
    });

    if (!story) {
      return res.status(404).json({ error: '스토리를 찾을 수 없습니다' });
    }

    if (story.quests.length === 0) {
      return res.status(400).json({ error: '스토리에 퀘스트가 없습니다' });
    }

    // 세션 생성
    const newSession = await prisma.session.create({
      data: {
        name,
        users: {
          connect: userIds.map((id: number | string) => ({ id: Number(id) }))
        },
        progress: {
          create: {
            storyId: Number(storyId),
            currentQuestId: story.quests[0].id,
            daoStatus: 'IDLE'
          }
        }
      },
      include: {
        users: true,
        progress: true
      }
    });

    res.status(201).json(newSession);
  } catch (error) {
    console.error('세션 생성 오류:', error);
    res.status(500).json({ error: '세션 생성 중 오류가 발생했습니다' });
  }
};

/**
 * @swagger
 * /api/sessions/{id}/status:
 *   put:
 *     summary: 세션의 DAO 상태를 업데이트합니다
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 세션 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [IDLE, VOTING, RESOLVED]
 *                 description: 변경할 DAO 상태
 *     responses:
 *       200:
 *         description: 업데이트된 세션 상태를 반환합니다
 *       400:
 *         description: 잘못된 요청 (잘못된 상태값)
 *       404:
 *         description: 세션을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
const updateSessionStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['IDLE', 'VOTING', 'RESOLVED'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: '유효한 상태값이 필요합니다 (IDLE, VOTING, RESOLVED)' });
  }

  try {
    const sessionProgress = await prisma.sessionProgress.findUnique({
      where: { sessionId: Number(id) }
    });

    if (!sessionProgress) {
      return res.status(404).json({ error: '세션을 찾을 수 없습니다' });
    }

    const updatedProgress = await prisma.sessionProgress.update({
      where: { sessionId: Number(id) },
      data: { daoStatus: status }
    });

    res.json(updatedProgress);
  } catch (error) {
    console.error('세션 상태 업데이트 오류:', error);
    res.status(500).json({ error: '세션 상태 업데이트 중 오류가 발생했습니다' });
  }
};

/**
 * @swagger
 * /api/sessions/{id}/progress:
 *   put:
 *     summary: 세션의 스토리 진행 상태를 업데이트합니다
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 세션 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questId
 *             properties:
 *               questId:
 *                 type: integer
 *                 description: 현재 진행 중인 퀘스트 ID
 *     responses:
 *       200:
 *         description: 업데이트된 세션 진행 상태를 반환합니다
 *       404:
 *         description: 세션 또는 퀘스트를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
const updateSessionProgress = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { questId } = req.body;

  if (!questId) {
    return res.status(400).json({ error: '현재 퀘스트 ID가 필요합니다' });
  }

  try {
    const sessionProgress = await prisma.sessionProgress.findUnique({
      where: { sessionId: Number(id) }
    });

    if (!sessionProgress) {
      return res.status(404).json({ error: '세션을 찾을 수 없습니다' });
    }

    // 유효한 퀘스트인지 확인
    const quest = await prisma.quest.findUnique({
      where: { id: Number(questId) }
    });

    if (!quest) {
      return res.status(404).json({ error: '퀘스트를 찾을 수 없습니다' });
    }

    const updatedProgress = await prisma.sessionProgress.update({
      where: { sessionId: Number(id) },
      data: { currentQuestId: Number(questId) }
    });

    res.json(updatedProgress);
  } catch (error) {
    console.error('세션 진행 업데이트 오류:', error);
    res.status(500).json({ error: '세션 진행 업데이트 중 오류가 발생했습니다' });
  }
};

// 라우터에 핸들러 연결
router.get('/', getSessions as RequestHandler);
router.get('/:id', getSession as RequestHandler);
router.post('/', createSession as RequestHandler);
router.put('/:id/status', updateSessionStatus as RequestHandler);
router.put('/:id/progress', updateSessionProgress as RequestHandler);

export default router; 