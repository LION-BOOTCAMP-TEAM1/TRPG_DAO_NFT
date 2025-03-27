import express, { Request, Response, RequestHandler } from 'express';
import prisma from '../prismaClient';

const router = express.Router();

/**
 * @swagger
 * /api/chapters:
 *   get:
 *     summary: 챕터 목록을 조회합니다
 *     tags: [Chapters]
 *     parameters:
 *       - in: query
 *         name: storyId
 *         schema:
 *           type: integer
 *         description: 필터링할 스토리 ID
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *         description: true인 경우 사용자가 이용 가능한 챕터만 반환
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: 사용자 ID (available=true인 경우 필요)
 *     responses:
 *       200:
 *         description: 챕터 목록을 반환합니다
 *       500:
 *         description: 서버 오류
 */
const getChapters = async (req: Request, res: Response) => {
  try {
    const { storyId, available, userId } = req.query;

    // Base query
    let query: any = {};

    // Filter by storyId if provided
    if (storyId) {
      query.storyId = parseInt(storyId as string);
    }

    // Get all chapters with their basic info
    const chapters = await prisma.chapter.findMany({
      where: query,
      orderBy: {
        sequence: 'asc',
      },
      include: {
        story: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
    });

    // If available=true and userId provided, filter chapters based on user progress
    if (available === 'true' && userId) {
      const userProgress = await prisma.chapterProgress.findMany({
        where: {
          userId: parseInt(userId as string),
        },
      });

      // Map of completed chapters
      const completedChapters = new Set(
        userProgress.filter((p) => p.completed).map((p) => p.chapterId)
      );

      // Filter chapters based on sequence (only show next available chapter)
      let availableChapters = [];
      let nextSequence = 0;

      for (const chapter of chapters) {
        if (
          chapter.sequence === nextSequence ||
          completedChapters.has(chapter.id)
        ) {
          availableChapters.push(chapter);
          if (!completedChapters.has(chapter.id)) {
            nextSequence = chapter.sequence + 1;
          }
        }
      }

      return res.json(availableChapters);
    }

    res.json(chapters);
  } catch (error) {
    console.error('Error fetching chapters:', error);
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
};

/**
 * @swagger
 * /api/chapters/{slug}:
 *   get:
 *     summary: slug로 특정 챕터 정보를 조회합니다
 *     tags: [Chapters]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: 챕터 Slug
 *     responses:
 *       200:
 *         description: 챕터 정보를 반환합니다
 *       404:
 *         description: 챕터를 찾을 수 없습니다
 *       500:
 *         description: 서버 오류
 */
const getChapterBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const chapter = await prisma.chapter.findUnique({
      where: {
        slug,
      },
      include: {
        story: {
          select: {
            title: true,
            slug: true,
          },
        },
        quests: {
          orderBy: {
            id: 'asc',
          },
        },
      },
    });

    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    res.json(chapter);
  } catch (error) {
    console.error('Error fetching chapter:', error);
    res.status(500).json({ error: 'Failed to fetch chapter' });
  }
};

/**
 * @swagger
 * /api/chapters/{slug}/stories:
 *   get:
 *     summary: 특정 챕터와 연관된 스토리를 조회합니다
 *     tags: [Chapters]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: 챕터 Slug
 *       - in: query
 *         name: includeScenesAndQuests
 *         schema:
 *           type: boolean
 *         description: true인 경우 씬, 퀘스트, 선택지도 함께 반환
 *     responses:
 *       200:
 *         description: 챕터와 연관된 스토리 정보를 반환합니다
 *       404:
 *         description: 챕터 또는 스토리를 찾을 수 없습니다
 *       500:
 *         description: 서버 오류
 */
const getChapterStories = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { includeScenesAndQuests } = req.query;

    // First get the chapter to ensure it exists
    const chapter = await prisma.chapter.findUnique({
      where: { slug },
      select: { id: true, storyId: true },
    });

    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    // Then get the associated story with the requested data
    const story = await prisma.story.findUnique({
      where: {
        id: chapter.storyId,
      },
      include: {
        StoryScene:
          includeScenesAndQuests === 'true'
            ? {
                orderBy: {
                  sequence: 'asc',
                },
              }
            : false,
        quests:
          includeScenesAndQuests === 'true'
            ? {
                where: {
                  chapterId: chapter.id,
                },
                include: {
                  choices: {
                    include: {
                      ChoiceCondition: true,
                    },
                  },
                },
              }
            : false,
        BranchPoint: includeScenesAndQuests === 'true',
      },
    });

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    res.json(story);
  } catch (error) {
    console.error('Error fetching stories for chapter:', error);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
};

/**
 * @swagger
 * /api/chapters/{slug}/progress:
 *   post:
 *     summary: 사용자의 챕터 진행 상황을 추적합니다
 *     tags: [Chapters]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: 챕터 Slug
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
 *                 description: 사용자 ID
 *               currentQuestId:
 *                 type: integer
 *                 description: 현재 진행 중인 퀘스트 ID
 *               completed:
 *                 type: boolean
 *                 description: 챕터 완료 여부
 *     responses:
 *       200:
 *         description: 업데이트된 진행 상황을 반환합니다
 *       400:
 *         description: 사용자 ID가 누락되었습니다
 *       404:
 *         description: 챕터를 찾을 수 없습니다
 *       500:
 *         description: 서버 오류
 */
const updateChapterProgress = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { userId, currentQuestId, completed } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Find the chapter
    const chapter = await prisma.chapter.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    // Update or create chapter progress
    const progress = await prisma.chapterProgress.upsert({
      where: {
        userId_chapterId: {
          userId: parseInt(userId),
          chapterId: chapter.id,
        },
      },
      update: {
        currentQuestId: currentQuestId ? parseInt(currentQuestId) : undefined,
        completed: completed !== undefined ? completed : undefined,
        lastUpdated: new Date(),
      },
      create: {
        userId: parseInt(userId),
        chapterId: chapter.id,
        currentQuestId: currentQuestId ? parseInt(currentQuestId) : null,
        completed: completed || false,
        lastUpdated: new Date(),
      },
    });

    res.json(progress);
  } catch (error) {
    console.error('Error updating chapter progress:', error);
    res.status(500).json({ error: 'Failed to update chapter progress' });
  }
};

// 라우터에 핸들러 연결
router.get('/', getChapters as RequestHandler);
router.get('/:slug', getChapterBySlug as RequestHandler);
router.get('/:slug/stories', getChapterStories as RequestHandler);
router.post('/:slug/progress', updateChapterProgress as RequestHandler);

export default router;
