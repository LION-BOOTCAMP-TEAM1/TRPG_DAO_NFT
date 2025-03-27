import express, { Request, Response, RequestHandler } from 'express';
import prisma from '../prismaClient';

const router = express.Router();

/**
 * @swagger
 * /api/story-worlds:
 *   get:
 *     summary: 모든 스토리 세계관 목록을 조회합니다
 *     tags: [StoryWorlds]
 *     responses:
 *       200:
 *         description: 스토리 세계관 목록을 반환합니다
 */
const getAllStoryWorlds = async (req: express.Request, res: express.Response) => {
  try {
    const storyWorlds = await prisma.storyWorld.findMany({
      orderBy: {
        createdAt: 'desc'  // 최신 세계관 순으로 정렬
      }
    });

    res.json(storyWorlds);
  } catch (error) {
    console.error('Error fetching story worlds:', error);
    res.status(500).json({ error: 'Failed to fetch story worlds' });
  }
};

/**
 * @swagger
 * /api/story-worlds/{slug}:
 *   get:
 *     summary: 특정 스토리 세계관 정보를 조회합니다
 *     tags: [StoryWorlds]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: 스토리 세계관 Slug
 *     responses:
 *       200:
 *         description: 스토리 세계관 정보를 반환합니다
 *       404:
 *         description: 스토리 세계관을 찾을 수 없습니다
 */
const getStoryWorldBySlug = async (req: express.Request, res: express.Response) => {
  const { slug } = req.params;

  try {
    const storyWorld = await prisma.storyWorld.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { stories: true }  // 세계관에 속한 스토리 수
        }
      }
    });

    if (!storyWorld) {
      return res.status(404).json({ error: 'Story world not found' });
    }

    res.json(storyWorld);
  } catch (error) {
    console.error('Error fetching story world:', error);
    res.status(500).json({ error: 'Failed to fetch story world' });
  }
};

/**
 * @swagger
 * /api/story-worlds/{slug}/stories:
 *   get:
 *     summary: 특정 세계관에 속한 스토리 목록을 조회합니다
 *     tags: [StoryWorlds]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: 스토리 세계관 Slug
 *     responses:
 *       200:
 *         description: 세계관에 속한 스토리 목록을 반환합니다
 *       404:
 *         description: 스토리 세계관을 찾을 수 없습니다
 */
const getStoriesByStoryWorldSlug = async (req: express.Request, res: express.Response) => {
  const { slug } = req.params;

  try {
    // 먼저 세계관 정보 조회
    const storyWorld = await prisma.storyWorld.findUnique({
      where: { slug }
    });

    if (!storyWorld) {
      return res.status(404).json({ error: 'Story world not found' });
    }

    // 세계관에 속한 스토리 목록 조회
    const stories = await prisma.story.findMany({
      where: { storyWorldId: storyWorld.id },
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        createdAt: true,
        _count: {
          select: {
            quests: true,
            BranchPoint: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'  // 최신 스토리 순으로 정렬
      }
    });

    res.json({
      storyWorld,
      stories
    });
  } catch (error) {
    console.error('Error fetching stories by story world:', error);
    res.status(500).json({ error: 'Failed to fetch stories by story world' });
  }
};

// 라우터에 핸들러 연결
router.get('/', getAllStoryWorlds as RequestHandler);
router.get('/:slug', getStoryWorldBySlug as RequestHandler);
router.get('/:slug/stories', getStoriesByStoryWorldSlug as RequestHandler);

export default router; 