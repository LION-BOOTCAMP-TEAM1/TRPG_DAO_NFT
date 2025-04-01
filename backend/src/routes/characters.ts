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
 *                   physicalAttack:
 *                     type: integer
 *                   magicAttack:
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 gender:
 *                   type: string
 *                 age:
 *                   type: integer
 *                 classId:
 *                   type: integer
 *                 attribute:
 *                   type: string
 *                 hp:
 *                   type: integer
 *                 mp:
 *                   type: integer
 *                 health:
 *                   type: integer
 *                 strength:
 *                   type: integer
 *                 agility:
 *                   type: integer
 *                 intelligence:
 *                   type: integer
 *                 wisdom:
 *                   type: integer
 *                 charisma:
 *                   type: integer
 *                 physicalAttack:
 *                   type: integer
 *                 magicAttack:
 *                   type: integer
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
  const { userId, name, gender, age, classId, attribute, hp, mp, health, strength, agility, intelligence, wisdom, charisma, sessionId, physicalAttack, magicAttack } = req.body;
  
  if (!userId || !name || !gender || !age || !classId || !attribute) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }
  
  try {
    const newCharacter = await prisma.character.create({
      data: {
        userId: Number(userId),
        name,
        gender,
        age: Number(age),
        classId: Number(classId),
        attribute,
        sessionId: sessionId ? Number(sessionId) : null,
        hp: hp || 4,
        mp: mp || 4,
        health: health || 4,
        strength: strength || 4,
        agility: agility || 4, 
        intelligence: intelligence || 4,
        wisdom: wisdom || 4,
        charisma: charisma || 4,
        physicalAttack: physicalAttack || 10,
        magicAttack: magicAttack || 10
      }
    });
    
    res.status(201).json(newCharacter);
  } catch (error) {
    console.error('Error creating character:', error);
    res.status(500).json({ error: 'Failed to create character' });
  }
};

/**
 * @swagger
 * /api/characters/{id}:
 *   patch:
 *     summary: 캐릭터 정보를 업데이트합니다
 *     tags: [Characters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 캐릭터 ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               gender:
 *                 type: string
 *               age:
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
 *               physicalAttack:
 *                 type: integer
 *               magicAttack:
 *                 type: integer
 *               sessionId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 캐릭터 업데이트 성공
 *       404:
 *         description: 캐릭터를 찾을 수 없습니다
 *       400:
 *         description: 입력 데이터 오류
 */
const updateCharacter = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { 
    name, gender, age, attribute, hp, mp, health, 
    strength, agility, intelligence, wisdom, charisma,
    physicalAttack, magicAttack, sessionId
  } = req.body;
  
  try {
    // 먼저 캐릭터가 존재하는지 확인
    const character = await prisma.character.findUnique({
      where: { id: Number(id) }
    });
    
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    // 업데이트할 데이터 객체 생성
    const updateData: any = {};
    
    // 요청에 포함된 필드만 업데이트
    if (name !== undefined) updateData.name = name;
    if (gender !== undefined) updateData.gender = gender;
    if (age !== undefined) updateData.age = Number(age);
    if (attribute !== undefined) updateData.attribute = attribute;
    if (hp !== undefined) updateData.hp = Number(hp);
    if (mp !== undefined) updateData.mp = Number(mp);
    if (health !== undefined) updateData.health = Number(health);
    if (strength !== undefined) updateData.strength = Number(strength);
    if (agility !== undefined) updateData.agility = Number(agility);
    if (intelligence !== undefined) updateData.intelligence = Number(intelligence);
    if (wisdom !== undefined) updateData.wisdom = Number(wisdom);
    if (charisma !== undefined) updateData.charisma = Number(charisma);
    if (physicalAttack !== undefined) updateData.physicalAttack = Number(physicalAttack);
    if (magicAttack !== undefined) updateData.magicAttack = Number(magicAttack);
    if (sessionId !== undefined) updateData.sessionId = sessionId ? Number(sessionId) : null;
    
    // 캐릭터 업데이트
    const updatedCharacter = await prisma.character.update({
      where: { id: Number(id) },
      data: updateData
    });
    
    res.json(updatedCharacter);
  } catch (error) {
    console.error('Error updating character:', error);
    res.status(500).json({ error: 'Failed to update character' });
  }
};

/**
 * @swagger
 * /api/characters/user/{userId}:
 *   get:
 *     summary: 특정 유저의 모든 캐릭터를 조회합니다
 *     tags: [Characters]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 유저 ID
 *     responses:
 *       200:
 *         description: 유저의 캐릭터 목록을 반환합니다
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
 *                   physicalAttack:
 *                     type: integer
 *                   magicAttack:
 *                     type: integer
 *                   class:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       recommendedStat1:
 *                         type: string
 *                       recommendedStat2:
 *                         type: string
 *       404:
 *         description: 캐릭터를 찾을 수 없습니다
 */
const getUserCharacters = async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  try {
    const characters = await prisma.character.findMany({
      where: { userId: Number(userId) },
      include: {
        class: true // 클래스 정보도 함께 가져옴
      }
    });
    
    res.json(characters);
  } catch (error) {
    console.error('Error fetching user characters:', error);
    res.status(500).json({ error: 'Failed to fetch user characters' });
  }
};

// 라우터에 핸들러 연결
router.get('/user/:userId', getUserCharacters as RequestHandler);
router.get('/:id', getCharacter as RequestHandler);
router.get('/', getCharacters as RequestHandler);
router.post('/', createCharacter as RequestHandler);
router.patch('/:id', updateCharacter as RequestHandler);

export default router; 