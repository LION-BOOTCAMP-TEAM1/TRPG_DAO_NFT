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

// ID 또는 슬러그로 퀘스트를 찾는 유틸리티 함수
async function findQuestByIdOrSlug(idOrSlug: string) {
  // 숫자인지 확인
  const isNumber = /^\d+$/.test(idOrSlug);
  
  if (isNumber) {
    return await prisma.quest.findUnique({
      where: { id: Number(idOrSlug) }
    });
  } else {
    return await prisma.quest.findUnique({
      where: { slug: idOrSlug }
    });
  }
}

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
 *                   slug:
 *                     type: string
 *                   storyId:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   choices:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         questId:
 *                           type: integer
 *                         text:
 *                           type: string
 *                         nextStoryId:
 *                           type: integer
 *                         nextStorySlug:
 *                           type: string
 */
const getQuests = async (req: express.Request, res: express.Response) => {
  try {
    const quests = await prisma.quest.findMany({
      include: {
        choices: true // 선택지도 함께 가져오기
      }
    });
    
    // 모든 퀘스트에 대해 처리
    if (quests.length > 0) {
      // 모든 선택지의 nextStoryId를 수집
      const storyIds = quests
        .flatMap(q => q.choices)
        .filter(choice => choice && choice.nextStoryId !== null)
        .map(choice => choice.nextStoryId as number);
      
      // 중복 제거 (Set 사용)
      const uniqueStoryIds = [...new Set(storyIds)];
      
      if (uniqueStoryIds.length > 0) {
        // 관련된 모든 스토리를 한 번의 쿼리로 가져오기
        const stories = await prisma.story.findMany({
          where: { id: { in: uniqueStoryIds } },
          select: { id: true, slug: true }
        });
        
        // ID를 키로 사용하는 맵 생성
        const storyMap = new Map(stories.map(story => [story.id, story.slug]));
        
        // 각 퀘스트의 각 선택지에 nextStorySlug 추가
        quests.forEach(quest => {
          if (quest.choices && quest.choices.length > 0) {
            quest.choices = quest.choices.map(choice => ({
              ...choice,
              nextStorySlug: choice.nextStoryId ? storyMap.get(choice.nextStoryId) || null : null
            }));
          }
        });
      }
    }
    
    res.json(quests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
};

/**
 * @swagger
 * /api/quests/{idOrSlug}:
 *   get:
 *     summary: 특정 퀘스트 정보를 조회합니다
 *     tags: [Quests]
 *     parameters:
 *       - in: path
 *         name: idOrSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: 퀘스트 ID 또는 Slug
 *     responses:
 *       200:
 *         description: 퀘스트 정보를 반환합니다
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 slug:
 *                   type: string
 *                 storyId:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 choices:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       questId:
 *                         type: integer
 *                       text:
 *                         type: string
 *                       nextStoryId:
 *                         type: integer
 *                       nextStorySlug:
 *                         type: string
 *       404:
 *         description: 퀘스트를 찾을 수 없습니다
 */
const getQuest = async (req: express.Request, res: express.Response) => {
  const { idOrSlug } = req.params;
  
  try {
    const quest = await findQuestByIdOrSlug(idOrSlug);
    
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    
    // 선택지 포함하여 반환
    const questWithChoices = await prisma.quest.findUnique({
      where: { id: quest.id },
      include: {
        choices: true
      }
    });
    
    // 각 Choice에 대해 nextStorySlug 추가
    if (questWithChoices && questWithChoices.choices && questWithChoices.choices.length > 0) {
      // 유효한 nextStoryId만 필터링
      const storyIds = questWithChoices.choices
        .filter(choice => choice.nextStoryId !== null)
        .map(choice => choice.nextStoryId as number);
      
      if (storyIds.length > 0) {
        // 관련된 모든 스토리를 한 번의 쿼리로 가져오기
        const stories = await prisma.story.findMany({
          where: { id: { in: storyIds } },
          select: { id: true, slug: true }
        });
        
        // ID를 키로 사용하는 맵 생성
        const storyMap = new Map(stories.map(story => [story.id, story.slug]));
        
        // 각 선택지에 nextStorySlug 추가
        const enhancedChoices = questWithChoices.choices.map(choice => ({
          ...choice,
          nextStorySlug: choice.nextStoryId ? storyMap.get(choice.nextStoryId) || null : null
        }));
        
        // 원래 객체에 업데이트된 선택지 배열 할당
        questWithChoices.choices = enhancedChoices;
      }
    }
    
    res.json(questWithChoices);
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
 *               - storyIdOrSlug
 *               - title
 *               - description
 *             properties:
 *               storyIdOrSlug:
 *                 type: string
 *                 description: 스토리 ID 또는 슬러그
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               slug:
 *                 type: string
 *                 description: 커스텀 슬러그 (없으면 제목에서 자동 생성)
 *     responses:
 *       201:
 *         description: 퀘스트 생성 성공
 *       400:
 *         description: 입력 데이터 오류
 */
const createQuest = async (req: express.Request, res: express.Response) => {
  const { storyIdOrSlug, title, description } = req.body;
  
  if (!storyIdOrSlug || !title || !description) {
    return res.status(400).json({ error: 'StoryIdOrSlug, title and description are required' });
  }
  
  try {
    // 스토리가 존재하는지 확인
    const story = await findStoryByIdOrSlug(storyIdOrSlug);
    
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }
    
    const newQuest = await prisma.quest.create({
      data: {
        storyId: story.id,
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
 * /api/quests/{idOrSlug}/choices:
 *   post:
 *     summary: 퀘스트에 새 선택지를 추가합니다
 *     tags: [Quests]
 *     parameters:
 *       - in: path
 *         name: idOrSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: 퀘스트 ID 또는 Slug
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
 *               nextStoryIdOrSlug:
 *                 type: string
 *                 description: 다음 스토리의 ID 또는 슬러그
 *               slug:
 *                 type: string
 *                 description: 커스텀 슬러그 (없으면 선택지 텍스트에서 자동 생성)
 *     responses:
 *       201:
 *         description: 선택지 추가 성공
 *       404:
 *         description: 퀘스트를 찾을 수 없습니다
 */
const addChoice = async (req: express.Request, res: express.Response) => {
  const { idOrSlug } = req.params;
  const { text, nextStoryIdOrSlug } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Choice text is required' });
  }
  
  try {
    // 퀘스트가 존재하는지 확인
    const quest = await findQuestByIdOrSlug(idOrSlug);
    
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    
    // 다음 스토리 ID 찾기 (제공된 경우)
    let nextStoryId = null;
    if (nextStoryIdOrSlug) {
      const nextStory = await findStoryByIdOrSlug(nextStoryIdOrSlug);
      if (nextStory) {
        nextStoryId = nextStory.id;
      }
    }
    
    const newChoice = await prisma.choice.create({
      data: {
        questId: quest.id,
        text,
        nextStoryId,
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
router.get('/:idOrSlug', getQuest as RequestHandler);
router.post('/', createQuest as RequestHandler);
router.post('/:idOrSlug/choices', addChoice as RequestHandler);

export default router; 