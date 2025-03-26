import express from 'express';
import prisma from '../prismaClient';

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 모든 사용자 목록을 조회합니다
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: 사용자 목록을 반환합니다
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: 사용자 ID
 *                   name:
 *                     type: string
 *                     description: 사용자 이름
 *                   email:
 *                     type: string
 *                     description: 사용자 이메일
 */
const getUsers = async (req: express.Request, res: express.Response) => {
  const users = await prisma.user.findMany();
  res.json(users);
};

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: 특정 사용자 정보를 조회합니다
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 사용자 정보를 반환합니다
 *       404:
 *         description: 사용자를 찾을 수 없습니다
 */
router.get('/:id', (req, res) => {
  // 실제 구현 코드
});

// 새 사용자 생성
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 새로운 사용자를 생성합니다
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wallet
 *             properties:
 *               wallet:
 *                 type: string
 *                 description: 사용자 지갑 주소
 *     responses:
 *       201:
 *         description: 생성된 사용자 정보를 반환합니다
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: 사용자 ID
 *                 walletAddress:
 *                   type: string
 *                   description: 사용자 지갑 주소
 *       400:
 *         description: 잘못된 요청 (지갑 주소 누락)
 */
const createUser = async (req: express.Request, res: express.Response) => {
  const { wallet } = req.body;

  if (!wallet) {
    res.status(400).json({ error: 'Wallet address is required' });
    return;
  }

  const newUser = await prisma.user.create({
    data: { walletAddress: wallet },
  });
  
  res.status(201).json(newUser);
};

// 라우터에 핸들러 연결
router.get('/', getUsers);
router.post('/', createUser);

export default router;
