import express from "express";
import prisma from "../prismaClient";
import { createFriendlyUserId } from "../utils/userUtils";

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
 *                   friendlyId:
 *                     type: string
 *                     description: 친숙한 형태의 사용자 ID
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
      createdAt: true,
      friendlyId: true
    }
  });
  
  // DB에 friendlyId가 없는 사용자만 friendlyId 생성
  const usersWithFriendlyId = await Promise.all(users.map(async user => {
    if (!user.friendlyId) {
      const friendlyId = createFriendlyUserId(user.walletAddress);
      
      // DB에 friendlyId 업데이트
      await prisma.user.update({
        where: { id: user.id },
        data: { friendlyId }
      });
      
      return { ...user, friendlyId };
    }
    return user;
  }));
  
  res.json(usersWithFriendlyId);
};

/**
 * @swagger
 * /api/users/by-friendly-id/{friendlyId}:
 *   get:
 *     summary: friendlyId로 사용자 정보를 조회합니다
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: friendlyId
 *         required: true
 *         schema:
 *           type: string
 *         description: 친숙한 형태의 사용자 ID
 *     responses:
 *       200:
 *         description: 사용자 정보를 반환합니다
 *       404:
 *         description: 사용자를 찾을 수 없습니다
 */
router.get("/by-friendly-id/:friendlyId", async (req, res) => {
  const { friendlyId } = req.params;
  
  if (!friendlyId) {
    return res.status(400).json({ error: "친숙한 ID가 필요합니다" });
  }
  
  try {
    const user = await prisma.user.findUnique({ 
      where: { friendlyId },
      select: {
        id: true,
        walletAddress: true,
        createdAt: true,
        friendlyId: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
    }
    
    res.json(user);
  } catch (error) {
    console.error("사용자 조회 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

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
      createdAt: true,
      friendlyId: true
    }
  });
  
  if (!user) {
    return res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
  }
  
  // DB에 friendlyId가 없는 경우 생성하고 DB 업데이트
  if (!user.friendlyId) {
    const friendlyId = createFriendlyUserId(user.walletAddress);
    
    // DB에 friendlyId 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: { friendlyId }
    });
    
    return res.json({ ...user, friendlyId });
  }
  
  res.json(user);
});

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
 *                 friendlyId:
 *                   type: string
 *                   description: 친숙한 형태의 사용자 ID
 *       400:
 *         description: 잘못된 요청 (지갑 주소 누락)
 */
const createUser = async (req: express.Request, res: express.Response) => {
  const { wallet } = req.body;

  if (!wallet) {
    res.status(400).json({ error: "지갑 주소가 필요합니다" });
    return;
  }

  // nonce 생성 추가
  const nonce = `${require('crypto').randomBytes(16).toString('hex')}`;
  const friendlyId = createFriendlyUserId(wallet);

  try {
    // 사용자 조회
    const existingUser = await prisma.user.findUnique({ 
      where: { walletAddress: wallet } 
    });

    if (existingUser) {
      // 기존 사용자 업데이트
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: { nonce }
      });
      console.log('사용자 업데이트 결과:', updatedUser);

      // upsert 이후에 확인 쿼리 추가
      const verifiedUser = await prisma.user.findUnique({
        where: { walletAddress: wallet }
      });
      
      if (!verifiedUser || verifiedUser.nonce !== nonce) {
        console.log('nonce 업데이트 실패, 강제 업데이트 시도');
        await prisma.user.update({
          where: { walletAddress: wallet },
          data: { nonce }
        });
      }
    } else {
      // 새 사용자 생성
      const newUser = await prisma.user.create({
        data: { 
          walletAddress: wallet, 
          nonce, 
          friendlyId 
        }
      });
      console.log('새 사용자 생성 결과:', newUser);

      // upsert 이후에 확인 쿼리 추가
      const verifiedUser = await prisma.user.findUnique({
        where: { walletAddress: wallet }
      });
      
      if (!verifiedUser || verifiedUser.nonce !== nonce) {
        console.log('nonce 업데이트 실패, 강제 업데이트 시도');
        await prisma.user.update({
          where: { walletAddress: wallet },
          data: { nonce }
        });
      }
    }

    res.status(201).json({ walletAddress: wallet, friendlyId });
  } catch (error: any) {
    console.error("사용자 생성 중 오류 발생:", error);
    
    // 중복된 friendlyId로 인한 오류인 경우 처리
    if (error.code === 'P2002' && error.meta?.target?.includes('friendlyId')) {
      // 새로운 friendlyId 생성 시도 (랜덤 요소 추가)
      const uniqueFriendlyId = `${friendlyId}-${Math.floor(Math.random() * 1000)}`;
      
      try {
        const retryUser = await prisma.user.upsert({
          where: { walletAddress: wallet },
          update: { 
            friendlyId: uniqueFriendlyId,
            nonce
          },
          create: { 
            walletAddress: wallet,
            nonce,
            friendlyId: uniqueFriendlyId
          },
        });
        
        return res.status(201).json(retryUser);
      } catch (retryError) {
        console.error("중복 friendlyId 오류 해결 중 추가 오류:", retryError);
        return res.status(500).json({ error: "사용자 생성 중 오류가 발생했습니다" });
      }
    }
    
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
};

// 라우터에 핸들러 연결
router.get("/", getUsers);
router.post("/", createUser);

export default router;
