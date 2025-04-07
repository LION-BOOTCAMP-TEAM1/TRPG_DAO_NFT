import express from 'express';
import { queueNFTMint } from '../services/nftService';
import { authenticateUser } from '../middleware/auth';
import { prisma } from '../utils/prisma-manager';

const router = express.Router();

/**
 * @swagger
 * /api/nft/mint:
 *   post:
 *     tags:
 *       - NFT
 *     summary: NFT 민팅 요청을 생성합니다
 *     description: 인증된 사용자가 NFT 민팅을 요청합니다. 민팅은 비동기적으로 처리됩니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - metadata
 *               - mintType
 *             properties:
 *               metadata:
 *                 type: object
 *                 description: NFT 메타데이터
 *               mintType:
 *                 type: string
 *                 description: "민팅 유형 (예: 'quest', 'achievement', 'item')"
 *               sessionId:
 *                 type: integer
 *                 description: 관련 게임 세션 ID (선택 사항)
 *               questId:
 *                 type: integer
 *                 description: 관련 퀘스트 ID (선택 사항)
 *     responses:
 *       201:
 *         description: 민팅 요청이 성공적으로 큐에 추가됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: NFT 민팅 요청이 성공적으로 큐에 추가되었습니다
 *                 requestId:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: 잘못된 요청 파라미터
 *       401:
 *         description: 인증되지 않은 사용자
 *       500:
 *         description: 서버 오류
 */
router.post('/mint', authenticateUser, async (req, res) => {
  try {
    const { metadata, mintType, sessionId, questId } = req.body;
    
    // authenticateUser 미들웨어는 req.user를 설정하므로, 타입 단언 사용
    const user = req.user as { userId: number; walletAddress: string };
    const userId = user.userId;
    const walletAddress = user.walletAddress;
    
    if (!metadata || !mintType) {
      return res.status(400).json({ error: '메타데이터와 민팅 타입은 필수입니다.' });
    }
    
    const mintRequest = await queueNFTMint(
      userId,
      walletAddress,
      metadata,
      mintType,
      sessionId,
      questId
    );
    
    res.status(201).json({
      message: 'NFT 민팅 요청이 성공적으로 큐에 추가되었습니다',
      requestId: mintRequest.id
    });
  } catch (error) {
    console.error('NFT 민팅 요청 처리 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/nft/user/{userId}:
 *   get:
 *     tags:
 *       - NFT
 *     summary: 유저의 NFT 목록을 조회합니다
 *     description: 특정 유저가 소유한 모든 NFT 목록을 조회합니다
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 유저 ID
 *     responses:
 *       200:
 *         description: 성공적으로 NFT 목록 조회
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   userId:
 *                     type: integer
 *                   nftTokenId:
 *                     type: string
 *                   tokenURI:
 *                     type: string
 *                   mintType:
 *                     type: string
 *                   txHash:
 *                     type: string
 *                   mintedAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: 서버 오류
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Prisma Raw Query로 변경하여 타입 문제 해결
    const nfts = await prisma.$queryRaw`
      SELECT * FROM "PlayerNFT" 
      WHERE "userId" = ${userId}
      ORDER BY "mintedAt" DESC
    `;
    
    res.json(nfts);
  } catch (error) {
    console.error('NFT 목록 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /api/nft/session/{sessionId}:
 *   get:
 *     tags:
 *       - NFT
 *     summary: 특정 세션의 NFT 목록을 조회합니다
 *     description: 게임 세션 중 생성된 모든 NFT 목록을 조회합니다
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 세션 ID
 *     responses:
 *       200:
 *         description: 성공적으로 세션 NFT 목록 조회
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   userId:
 *                     type: integer
 *                   sessionId:
 *                     type: integer
 *                   nftTokenId:
 *                     type: string
 *                   user:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       username:
 *                         type: string
 *       500:
 *         description: 서버 오류
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    
    // Prisma Raw Query로 변경하여 타입 문제 해결
    const nfts = await prisma.$queryRaw`
      SELECT p.*, u.* FROM "PlayerNFT" p
      JOIN "User" u ON p."userId" = u.id
      WHERE p."sessionId" = ${sessionId}
      ORDER BY p."mintedAt" DESC
    ` as any[]; // SQL 결과에 타입 단언 추가
    
    // 결과를 클라이언트 친화적인 형식으로 변환
    const formattedNfts = nfts.map((nft: any) => {
      // 사용자 정보와 NFT 정보 분리
      const { id, walletAddress, createdAt, ...userRest } = nft;
      return {
        id: nft.id,
        userId: nft.userId,
        nftTokenId: nft.nftTokenId,
        tokenURI: nft.tokenURI,
        mintType: nft.mintType,
        txHash: nft.txHash,
        mintedAt: nft.mintedAt,
        sessionId: nft.sessionId,
        questId: nft.questId,
        user: {
          id: nft.userId,
          walletAddress: nft.walletAddress,
          // 기타 필요한 사용자 정보
        }
      };
    });
    
    res.json(formattedNfts);
  } catch (error) {
    console.error('세션 NFT 목록 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

export default router;
