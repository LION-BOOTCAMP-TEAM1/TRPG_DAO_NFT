import express, { Request, Response, RequestHandler } from 'express';
import prisma from '../prismaClient';

const router = express.Router();

/**
 * @swagger
 * /api/characters:
 *   get:
 *     summary: 모든 캐릭터 목록을 조회합니다
 *     tags: [Characters]
 *     responses:
 *       200:
 *         description: 캐릭터 목록을 반환합니다
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
 *                   gender:
 *                     type: string
 *                   age:
 *                     type: integer
 *                   classId:
 *                     type: integer
 *                   attribute:
 *                     type: string
 *                   hp:
 *                     type: integer
 *                   mp:
 *                     type: integer
 *                   health:
 *                     type: integer
 *                   strength:
 *                     type: integer
 *                   agility:
 *                     type: integer
 *                   intelligence:
 *                     type: integer
 *                   wisdom:
 *                     type: integer
 *                   charisma:
 *                     type: integer
 */
const getCharacters = async (req: Request, res: Response) => {
  try {
    const characters = await prisma.character.findMany();
    res.json(characters);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch characters' });
  }
};

/**
 * @swagger
 * /api/characters/{id}:
 *   get:
 *     summary: 특정 캐릭터 정보를 조회합니다
 *     tags: [Characters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 캐릭터 ID
 *     responses:
 *       200:
 *         description: 캐릭터 정보를 반환합니다
 *       404:
 *         description: 캐릭터를 찾을 수 없습니다
 */
const getCharacter = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const character = await prisma.character.findUnique({
      where: { id: Number(id) }
    });
    
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    res.json(character);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch character' });
  }
};

/**
 * @swagger
 * /api/characters:
 *   post:
 *     summary: 새 캐릭터를 생성합니다
 *     tags: [Characters]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - name
 *               - gender
 *               - age
 *               - classId
 *               - attribute
 *             properties:
 *               userId:
 *                 type: integer
 *               name:
 *                 type: string
 *               gender:
 *                 type: string
 *               age:
 *                 type: integer
 *               classId:
 *                 type: integer
 *               attribute:
 *                 type: string
 *               hp:
 *                 type: integer
 *               mp:
 *                 type: integer
 *               health:
 *                 type: integer
 *               strength:
 *                 type: integer
 *               agility:
 *                 type: integer
 *               intelligence:
 *                 type: integer
 *               wisdom:
 *                 type: integer
 *               charisma:
 *                 type: integer
 *     responses:
 *       201:
 *         description: 캐릭터 생성 성공
 *       400:
 *         description: 입력 데이터 오류
 */
const createCharacter = async (req: Request, res: Response) => {
  const { userId, name, gender, age, classId, attribute, hp, mp, health, strength, agility, intelligence, wisdom, charisma } = req.body;
  
  if (!userId || !name || !gender || !age || !classId || !attribute) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }
  
  try {
    // 이미 해당 유저의 캐릭터가 있는지 확인
    const existingCharacter = await prisma.character.findFirst({
      where: { userId: Number(userId) }
    });
    
    if (existingCharacter) {
      return res.status(400).json({ error: 'User already has a character' });
    }
    
    const newCharacter = await prisma.character.create({
      data: {
        userId: Number(userId),
        name,
        gender,
        age: Number(age),
        classId: Number(classId),
        attribute,
        hp: hp || 4,
        mp: mp || 4,
        health: health || 4,
        strength: strength || 4,
        agility: agility || 4, 
        intelligence: intelligence || 4,
        wisdom: wisdom || 4,
        charisma: charisma || 4
      }
    });
    
    res.status(201).json(newCharacter);
  } catch (error) {
    console.error('Error creating character:', error);
    res.status(500).json({ error: 'Failed to create character' });
  }
};

// 라우터에 핸들러 연결
router.get('/', getCharacters as RequestHandler);
router.get('/:id', getCharacter as RequestHandler);
router.post('/', createCharacter as RequestHandler);

export default router; 