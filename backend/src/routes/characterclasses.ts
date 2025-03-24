import express, { Request, Response, RequestHandler } from 'express';
import prisma from '../prismaClient';

const router = express.Router();

/**
 * @swagger
 * /api/characterclasses:
 *   get:
 *     summary: 모든 캐릭터 클래스 목록을 조회합니다
 *     tags: [CharacterClasses]
 *     responses:
 *       200:
 *         description: 캐릭터 클래스 목록을 반환합니다
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   code:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   recommendedStat1:
 *                     type: string
 *                   recommendedStat2:
 *                     type: string
 */
const getCharacterClasses = async (req: Request, res: Response) => {
  try {
    const characterClasses = await prisma.characterClass.findMany();
    res.json(characterClasses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch character classes' });
  }
};

/**
 * @swagger
 * /api/characterclasses/{id}:
 *   get:
 *     summary: 특정 캐릭터 클래스 정보를 조회합니다
 *     tags: [CharacterClasses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 캐릭터 클래스 ID
 *     responses:
 *       200:
 *         description: 캐릭터 클래스 정보를 반환합니다
 *       404:
 *         description: 캐릭터 클래스를 찾을 수 없습니다
 */
const getCharacterClass = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const characterClass = await prisma.characterClass.findUnique({
      where: { id: Number(id) }
    });
    
    if (!characterClass) {
      return res.status(404).json({ error: 'Character class not found' });
    }
    
    res.json(characterClass);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch character class' });
  }
};

// 라우터에 핸들러 연결
router.get('/', getCharacterClasses as RequestHandler);
router.get('/:id', getCharacterClass as RequestHandler);

export default router; 