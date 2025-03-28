import express, { Request, Response, RequestHandler } from 'express';
import prisma from '../prismaClient';

const router = express.Router();

// ID 또는 슬러그로 스토리를 찾는 유틸리티 함수
async function findStoryByIdOrSlug(idOrSlug: string) {
  // 숫자인지 확인
  const isNumber = /^\d+$/.test(idOrSlug);
  
  if (isNumber) {
    return await prisma.story.findUnique({
      where: { id: Number(idOrSlug) }
    });
  } else {
    return await prisma.story.findUnique({
      where: { slug: idOrSlug }
    });
  }
}

/**
 * @swagger
 * /api/stories/{idOrSlug}:
 *   get:
 *     summary: 특정 스토리 정보를 조회합니다
 *     tags: [Stories]
 *     parameters:
 *       - in: path
 *         name: idOrSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: 스토리 ID 또는 Slug
 *     responses:
 *       200:
 *         description: 스토리 정보를 반환합니다
 *       404:
 *         description: 스토리를 찾을 수 없습니다
 */
const getStory = async (req: express.Request, res: express.Response) => {
  const { idOrSlug } = req.params;

  try {
    // 먼저 ID 또는 슬러그로 스토리 기본 정보를 찾음
    const storyBase = await findStoryByIdOrSlug(idOrSlug);
    
    if (!storyBase) {
      return res.status(404).json({ error: 'Story not found' });
    }
    
    // 찾은 스토리의 ID로 상세 정보를 조회
    const story = await prisma.story.findUnique({
      where: { id: storyBase.id },
      include: {
        quests: {
          include: {
            choices: true
          }
        },
        BranchPoint: {
          include: {
            BranchPointScene: {
              orderBy: {
                order: 'asc',
              },
            },
            DAOChoice: true,
          },
        },
        StoryScene: {
          orderBy: {
            sequence: 'asc',
          },
        },
      },
    });

    res.json(story);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch story' });
  }
};

// 라우터에 핸들러 연결
router.get('/:idOrSlug', getStory as RequestHandler);

export default router;
