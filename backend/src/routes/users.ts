import express from "express";
import prisma from "../prismaClient";

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
 *                   walletAddress:
 *                     type: string
 *                     description: 사용자 지갑 주소
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: 사용자 생성일
 */
const getUsers = async (req: express.Request, res: express.Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      walletAddress: true,
      createdAt: true
    }
  });
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
router.get("/:id", async (req, res) => {
  const userId = parseInt(req.params.id);
  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    select: {
      id: true,
      walletAddress: true,
      createdAt: true
    }
  });
  
  if (!user) {
    return res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
  }
  
  res.json(user);
});

// 새 사용자 생성
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 새로운 사용자를 생성합니다
 *     description: 지갑 주소로 사용자를 생성합니다. 주로 관리자나 서비스에서 명시적으로 사용자를 등록할 때 사용합니다. 일반적인 Web3 로그인 과정에서는 auth/nonce 엔드포인트에서 자동으로 사용자가 생성됩니다.
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
    res.status(400).json({ error: "지갑 주소가 필요합니다" });
    return;
  }

  const user = await prisma.user.upsert({
    where: { walletAddress: wallet },
    update: {}, // 업데이트할 내용이 없으면 빈 객체
    create: { walletAddress: wallet },
  });

  res.status(201).json(user);
};

// 라우터에 핸들러 연결
router.get("/", getUsers);
router.post("/", createUser);

export default router;
