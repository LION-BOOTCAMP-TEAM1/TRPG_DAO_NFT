import express, { Request, Response, RequestHandler } from 'express';
import prisma from '../prismaClient';

const router = express.Router();

// ID 또는 슬러그로 세션을 찾는 유틸리티 함수
async function findSessionByIdOrSlug(idOrSlug: string) {
  const isNumber = /^\d+$/.test(idOrSlug);
  
  if (isNumber) {
    return await prisma.session.findUnique({
      where: { id: Number(idOrSlug) }
    });
  }
  return null;
}

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
 * /api/sessions/{idOrSlug}:
 *   get:
 *     summary: 특정 세션 정보를 조회합니다
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: idOrSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: 세션 ID (또는 향후 슬러그)
 *     responses:
 *       200:
 *         description: 세션 정보를 반환합니다
 *       404:
 *         description: 세션을 찾을 수 없습니다
 *       500:
 *         description: 서버 오류
 */
const getSession = async (req: Request, res: Response) => {
  const { idOrSlug } = req.params;

  try {
    const sessionBase = await findSessionByIdOrSlug(idOrSlug);
    
    if (!sessionBase) {
      return res.status(404).json({ error: '세션을 찾을 수 없습니다' });
    }
    
    const session = await prisma.session.findUnique({
      where: { id: sessionBase.id },
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
        participants: {
          include: {
            user: {
              select: {
                id: true,
                walletAddress: true
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
 *               - storyWorldId
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
 *               storyWorldId:
 *                 type: integer
 *                 description: 스토리 월드 ID
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
  const { name, userIds, storyId, storyWorldId } = req.body;

  if (!name || !userIds || userIds.length === 0 || !storyId || !storyWorldId) {
    return res.status(400).json({ error: '세션 이름, 참여 사용자, 스토리 및 스토리 월드 정보가 필요합니다' });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds }
      }
    });

    if (users.length !== userIds.length) {
      return res.status(404).json({ error: '일부 사용자를 찾을 수 없습니다' });
    }

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

    const newSession = await prisma.session.create({
      data: {
        name,
        storyWorldId: Number(storyWorldId),
        progress: {
          create: {
            storyId: Number(storyId),
            currentQuestId: story.quests[0].id,
            daoStatus: 'IDLE'
          }
        }
      },
      include: {
        progress: true
      }
    });

    await prisma.sessionParticipant.createMany({
      data: userIds.map((userId: number | string) => ({
        sessionId: newSession.id,
        userId: Number(userId)
      }))
    });

    const sessionWithParticipants = await prisma.session.findUnique({
      where: { id: newSession.id },
      include: {
        participants: {
          include: {
            user: true
          }
        },
        progress: true
      }
    });

    res.status(201).json(sessionWithParticipants);
  } catch (error) {
    console.error('세션 생성 오류:', error);
    res.status(500).json({ error: '세션 생성 중 오류가 발생했습니다' });
  }
};

/**
 * @swagger
 * /api/sessions/{idOrSlug}/status:
 *   put:
 *     summary: 세션의 DAO 상태를 업데이트합니다
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: idOrSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: 세션 ID (또는 향후 슬러그)
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
  const { idOrSlug } = req.params;
  const { status } = req.body;

  const validStatuses = ['IDLE', 'VOTING', 'RESOLVED'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: '유효한 상태값이 필요합니다 (IDLE, VOTING, RESOLVED)' });
  }

  try {
    const sessionBase = await findSessionByIdOrSlug(idOrSlug);
    
    if (!sessionBase) {
      return res.status(404).json({ error: '세션을 찾을 수 없습니다' });
    }

    const sessionProgress = await prisma.sessionProgress.findUnique({
      where: { sessionId: sessionBase.id }
    });

    if (!sessionProgress) {
      return res.status(404).json({ error: '세션을 찾을 수 없습니다' });
    }

    const updatedProgress = await prisma.sessionProgress.update({
      where: { sessionId: sessionBase.id },
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
 * /api/sessions/{idOrSlug}/progress:
 *   put:
 *     summary: 세션의 스토리 진행 상태를 업데이트합니다
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: idOrSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: 세션 ID (또는 향후 슬러그)
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
 *               currentChapterId:
 *                 type: integer
 *                 description: 현재 진행 중인 챕터 ID
 *               currentSceneId:
 *                 type: integer
 *                 description: 현재 진행 중인 씬 ID
 *     responses:
 *       200:
 *         description: 업데이트된 세션 진행 상태를 반환합니다
 *       404:
 *         description: 세션 또는 퀘스트를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
const updateSessionProgress = async (req: Request, res: Response) => {
  const { idOrSlug } = req.params;
  const { questId, currentChapterId, currentSceneId } = req.body;

  if (!questId) {
    return res.status(400).json({ error: '현재 퀘스트 ID가 필요합니다' });
  }

  try {
    const sessionBase = await findSessionByIdOrSlug(idOrSlug);
    
    if (!sessionBase) {
      return res.status(404).json({ error: '세션을 찾을 수 없습니다' });
    }

    const sessionProgress = await prisma.sessionProgress.findUnique({
      where: { sessionId: sessionBase.id }
    });

    if (!sessionProgress) {
      return res.status(404).json({ error: '세션을 찾을 수 없습니다' });
    }

    const quest = await prisma.quest.findUnique({
      where: { id: Number(questId) }
    });

    if (!quest) {
      return res.status(404).json({ error: '퀘스트를 찾을 수 없습니다' });
    }

    const updatedProgress = await prisma.sessionProgress.update({
      where: { sessionId: sessionBase.id },
      data: { 
        currentQuestId: Number(questId), 
        currentChapterId: currentChapterId ? Number(currentChapterId) : undefined,
        currentSceneId: currentSceneId ? Number(currentSceneId) : undefined
      }
    });

    res.json(updatedProgress);
  } catch (error) {
    console.error('세션 진행 업데이트 오류:', error);
    res.status(500).json({ error: '세션 진행 업데이트 중 오류가 발생했습니다' });
  }
};

/**
 * @swagger
 * /api/sessions/{idOrSlug}/participants:
 *   get:
 *     summary: 세션에 참여한 유저 목록을 조회합니다
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: idOrSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: 세션 ID 또는 슬러그
 *     responses:
 *       200:
 *         description: 세션 참여자 목록 반환
 *       404:
 *         description: 세션을 찾을 수 없습니다
 *       500:
 *         description: 서버 오류
 */

/**
 * @swagger
 * /api/sessions/{idOrSlug}/participants:
 *   post:
 *     summary: 특정 세션에 유저를 참여자로 추가합니다
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: idOrSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: 세션 ID 또는 슬러그
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: 참여할 유저의 ID
 *     responses:
 *       201:
 *         description: 유저가 세션에 성공적으로 참여함
 *       400:
 *         description: 이미 참여 중이거나 유효하지 않은 요청
 *       404:
 *         description: 세션을 찾을 수 없습니다
 *       500:
 *         description: 서버 오류
 */
const getSessionParticipants = async (req: Request, res: Response) => {
  const { idOrSlug } = req.params;

  try {
    const sessionBase = await findSessionByIdOrSlug(idOrSlug);

    if (!sessionBase) {
      return res.status(404).json({ error: '세션을 찾을 수 없습니다' });
    }

    const participants = await prisma.sessionParticipant.findMany({
      where: { sessionId: sessionBase.id },
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true
          }
        }
      }
    });

    res.json(participants);
  } catch (error) {
    console.error('세션 참여자 조회 오류:', error);
    res.status(500).json({ error: '세션 참여자 조회 중 오류가 발생했습니다' });
  }
};

// 특정 세션에 유저 1명을 참여자로 등록하는 핸들러
const joinSession = async (req: Request, res: Response) => {
  const { idOrSlug } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId가 필요합니다' });
  }

  try {
    const sessionBase = await findSessionByIdOrSlug(idOrSlug);
    if (!sessionBase) {
      return res.status(404).json({ error: '세션을 찾을 수 없습니다' });
    }

    const existing = await prisma.sessionParticipant.findUnique({
      where: {
        sessionId_userId: {
          sessionId: sessionBase.id,
          userId: Number(userId)
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: '이미 세션에 참여 중입니다' });
    }

    const participant = await prisma.sessionParticipant.create({
      data: {
        sessionId: sessionBase.id,
        userId: Number(userId)
      }
    });

    res.status(201).json(participant);
  } catch (error) {
    console.error('세션 참여 오류:', error);
    res.status(500).json({ error: '세션 참여 중 오류가 발생했습니다' });
  }
};

// 라우터에 핸들러 연결
router.get('/', getSessions as RequestHandler);
router.get('/:idOrSlug', getSession as RequestHandler);
router.get('/:idOrSlug/participants', getSessionParticipants as RequestHandler);
router.post('/', createSession as RequestHandler);
router.post('/:idOrSlug/participants', joinSession as RequestHandler);
router.put('/:idOrSlug/status', updateSessionStatus as RequestHandler);
router.put('/:idOrSlug/progress', updateSessionProgress as RequestHandler);

export default router;