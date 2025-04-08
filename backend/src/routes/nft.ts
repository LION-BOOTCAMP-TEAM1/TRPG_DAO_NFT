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
router.post('/mint', async (req, res) => {
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

/**
 * @swagger
 * /api/nft/mintByID:
 *   post:
 *     tags:
 *       - NFT
 *     summary: 특정 토큰 ID로 직접 NFT를 민팅합니다
 *     description: 특정 지갑 주소로 지정된 토큰 ID의 NFT를 민팅하기 위한 트랜잭션 데이터를 생성합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *               - tokenId
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 description: NFT를 받을 지갑 주소
 *               tokenId:
 *                 type: integer
 *                 description: 민팅할 NFT 토큰 ID (0-92 사이의 값)
 *               metadataURI:
 *                 type: string
 *                 description: 커스텀 메타데이터 URI (선택 사항)
 *     responses:
 *       200:
 *         description: 트랜잭션 데이터가 성공적으로 생성됨
 *       400:
 *         description: 잘못된 요청 파라미터
 *       500:
 *         description: 서버 오류
 */
router.post('/mintByID', async (req, res) => {
  try {
    const { walletAddress, tokenId, metadataURI } = req.body;
    
    // 필수 파라미터 확인
    if (!walletAddress || tokenId === undefined) {
      return res.status(400).json({ error: '지갑 주소와 토큰 ID는 필수입니다' });
    }
    
    // 토큰 ID 범위 확인
    if (tokenId < 0 || tokenId > 92) {
      return res.status(400).json({ error: '토큰 ID는 0에서 92 사이여야 합니다' });
    }
    
    // ethers와 컨트랙트 ABI 가져오기
    const { ethers } = require('ethers');
    const GameNFTABI = require('../utils/abis/GameItem.json');
    
    // 환경 변수 로드 - 개인키를 사용하지 않음
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');
    const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS || '';
    
    if (!NFT_CONTRACT_ADDRESS) {
      return res.status(500).json({ error: '컨트랙트 설정이 올바르지 않습니다' });
    }
    
    // 컨트랙트 인터페이스 생성
    const nftInterface = new ethers.utils.Interface(GameNFTABI);
    
    // mintByID 함수 호출을 위한 데이터 생성
    const data = nftInterface.encodeFunctionData('mintByID', [
      walletAddress,
      tokenId
    ]);
    
    // 트랜잭션 객체 생성
    const txObject = {
      to: NFT_CONTRACT_ADDRESS,
      data: data,
      gasLimit: ethers.utils.hexlify(500000)
    };
    
    // 트랜잭션 객체 반환 - 클라이언트에서 서명하도록 함
    res.status(200).json({
      message: '민팅 트랜잭션 데이터가 생성되었습니다. 클라이언트에서 서명이 필요합니다.',
      transaction: txObject,
      metadataURI,
      tokenId
    });
    
  } catch (error) {
    console.error('NFT 민팅 데이터 생성 오류:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: '민팅 데이터 생성 중 오류가 발생했습니다: ' + error.message });
    } else {
      res.status(500).json({ error: '민팅 데이터 생성 중 알 수 없는 오류가 발생했습니다' });
    }
  }
});

export default router;
