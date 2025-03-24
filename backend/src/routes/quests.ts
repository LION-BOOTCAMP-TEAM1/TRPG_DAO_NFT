import express, { Request, Response, RequestHandler } from 'express';
import prisma from '../prismaClient';

const router = express.Router();

// 문자열을 URL 친화적인 slug로 변환하는 함수
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '') // 특수문자 제거
    .replace(/ +/g, '-'); // 공백을 하이픈으로 변환
}

/**
 * @swagger
 * /api/quests:
 *   get:
 *     summary: 모든 퀘스트 목록을 조회합니다
 *     tags: [Quests]
 *     responses:
 *       200:
 *         description: 퀘스트 목록을 반환합니다
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   storyId:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 */
const getQuests = async (req: express.Request, res: express.Response) => {
  try {
    const quests = await prisma.quest.findMany();
    res.json(quests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
};

/**
 * @swagger
 * /api/quests/{id}:
 *   get:
 *     summary: 특정 퀘스트 정보를 조회합니다
 *     tags: [Quests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 퀘스트 ID
 *     responses:
 *       200:
 *         description: 퀘스트 정보를 반환합니다
 *       404:
 *         description: 퀘스트를 찾을 수 없습니다
 */
const getQuest = async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  
  try {
    const quest = await prisma.quest.findUnique({
      where: { id: Number(id) },
      include: {
        choices: true
      }
    });
    
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    
    res.json(quest);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quest' });
  }
};

/**
 * @swagger
 * /api/quests:
 *   post:
 *     summary: 새 퀘스트를 생성합니다
 *     tags: [Quests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storyId
 *               - title
 *               - description
 *             properties:
 *               storyId:
 *                 type: integer
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: 퀘스트 생성 성공
 *       400:
 *         description: 입력 데이터 오류
 */
const createQuest = async (req: express.Request, res: express.Response) => {
  const { storyId, title, description } = req.body;
  
  if (!storyId || !title || !description) {
    return res.status(400).json({ error: 'StoryId, title and description are required' });
  }
  
  try {
    // 스토리가 존재하는지 확인
    const story = await prisma.story.findUnique({
      where: { id: Number(storyId) }
    });
    
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }
    
    const newQuest = await prisma.quest.create({
      data: {
        storyId: Number(storyId),
        title,
        description,
        slug: req.body.slug || slugify(title)
      }
    });
    
    res.status(201).json(newQuest);
  } catch (error) {
    console.error('Error creating quest:', error);
    res.status(500).json({ error: 'Failed to create quest' });
  }
};

/**
 * @swagger
 * /api/quests/{id}/choices:
 *   post:
 *     summary: 퀘스트에 새 선택지를 추가합니다
 *     tags: [Quests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 퀘스트 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *               nextStoryId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: 선택지 추가 성공
 *       404:
 *         description: 퀘스트를 찾을 수 없습니다
 */
const addChoice = async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const { text, nextStoryId } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Choice text is required' });
  }
  
  try {
    // 퀘스트가 존재하는지 확인
    const quest = await prisma.quest.findUnique({
      where: { id: Number(id) }
    });
    
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    
    const newChoice = await prisma.choice.create({
      data: {
        questId: Number(id),
        text,
        nextStoryId: nextStoryId ? Number(nextStoryId) : null,
        slug: req.body.slug || slugify(text)
      }
    });
    
    res.status(201).json(newChoice);
  } catch (error) {
    console.error('Error adding choice:', error);
    res.status(500).json({ error: 'Failed to add choice' });
  }
};

// 라우터에 핸들러 연결
router.get('/', getQuests as RequestHandler);
router.get('/:id', getQuest as RequestHandler);
router.post('/', createQuest as RequestHandler);
router.post('/:id/choices', addChoice as RequestHandler);

export default router; 