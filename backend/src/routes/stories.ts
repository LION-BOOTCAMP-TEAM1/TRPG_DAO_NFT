import express, { Request, Response, RequestHandler } from 'express';
import prisma from '../prismaClient';

const router = express.Router();

/**
 * @swagger
 * /api/stories/{id}:
 *   get:
 *     summary: 특정 스토리 정보를 조회합니다
 *     tags: [Stories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 스토리 ID
 *     responses:
 *       200:
 *         description: 스토리 정보를 반환합니다
 *       404:
 *         description: 스토리를 찾을 수 없습니다
 */
const getStory = async (req: express.Request, res: express.Response) => {
  const { id } = req.params;

  try {
    const story = await prisma.story.findUnique({
      where: { id: Number(id) },
      include: {
        quests: true,
        BranchPoint: true,
        StoryScene: {
          orderBy: {
            sequence: 'asc'
          }
        },
      },
    });

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    res.json(story);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch story' });
  }
};

// 라우터에 핸들러 연결
router.get('/:id', getStory as RequestHandler);

export default router;
