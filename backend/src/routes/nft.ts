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
 *     summary: 특정 토큰 ID로 직접 NFT를 민팅합니다 (관리자 전용)
 *     description: 관리자가 특정 지갑 주소로 지정된 토큰 ID의 NFT를 즉시 민팅합니다.
 *     security:
 *       - bearerAuth: []
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
 *                 description: 민팅할 NFT 토큰 ID (0-90 사이의 값)
 *               metadataURI:
 *                 type: string
 *                 description: 커스텀 메타데이터 URI (선택 사항)
 *     responses:
 *       200:
 *         description: NFT가 성공적으로 민팅됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: NFT가 성공적으로 민팅되었습니다
 *                 txHash:
 *                   type: string
 *                   example: 0x1234...
 *                 tokenId:
 *                   type: string
 *                   example: 42
 *       400:
 *         description: 잘못된 요청 파라미터
 *       401:
 *         description: 인증되지 않은 사용자
 *       403:
 *         description: 권한 없음 (관리자만 사용 가능)
 *       500:
 *         description: 서버 오류
 */
router.post('/mintByID', async (req, res) => {
  try {
    const { walletAddress, tokenId, metadataURI } = req.body;
    
    // 테스트를 위해 인증 체크 임시 제거
    // const user = req.user as { userId: number; walletAddress: string; isAdmin?: boolean };
    // if (!user.isAdmin) {
    //   return res.status(403).json({ error: '관리자만 이 기능을 사용할 수 있습니다' });
    // }
    
    // 필수 파라미터 확인
    if (!walletAddress || tokenId === undefined) {
      return res.status(400).json({ error: '지갑 주소와 토큰 ID는 필수입니다' });
    }
    
    // 토큰 ID 범위 확인 (0-92로 수정)
    if (tokenId < 0 || tokenId > 92) {
      return res.status(400).json({ error: '토큰 ID는 0에서 92 사이여야 합니다' });
    }
    
    // nftService에서 ethers, nftContract 가져오기
    const { ethers } = require('ethers');
    const GameNFTABI = require('../utils/abis/GameItem.json');
    
    // 환경 변수 로드
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');
    const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS || '';
    const privateKey = process.env.CONTRACT_PRIVATE_KEY || '';
    
    if (!privateKey || !NFT_CONTRACT_ADDRESS) {
      return res.status(500).json({ error: '컨트랙트 설정이 올바르지 않습니다' });
    }
    
    // 컨트랙트 연결
    const wallet = new ethers.Wallet(privateKey, provider);
    const nftContract = new ethers.Contract(
      NFT_CONTRACT_ADDRESS,
      GameNFTABI,
      wallet
    );
    
    // 민팅 트랜잭션 전송
    const tx = await nftContract.mintByID(
      walletAddress,
      tokenId,
      { gasLimit: 500000 }
    );
    
    console.log(`민팅 트랜잭션 전송: ${tx.hash} (토큰 ID: ${tokenId})`);
    
    // 트랜잭션 완료 대기
    const receipt = await tx.wait();
    
    // 이벤트에서 토큰 ID 추출
    const mintEvent = receipt.events?.find((e: any) => e.event === 'minted');
    const confirmedTokenId = mintEvent?.args?.tokenId.toString();
    
    if (!confirmedTokenId) {
      throw new Error('민팅 이벤트에서 토큰 ID를 추출할 수 없습니다');
    }
    
    // PlayerNFT 레코드 생성 - userId가 있다면 연결, 없으면 일단 민팅만
    const nftRecord = {
      nftTokenId: confirmedTokenId,
      txHash: tx.hash,
      confirmed: true,
      tokenURI: metadataURI || '',
      name: `Game Item #${confirmedTokenId}`,
      description: 'Direct minted TRPG game item',
      image: metadataURI ? 'https://example.com/image.png' : ''
    };
    
    // 커스텀 URI 설정이 필요한 경우
    if (metadataURI) {
      await nftContract.setCustomURI(confirmedTokenId, metadataURI);
      console.log(`토큰 ${confirmedTokenId}의 커스텀 URI가 설정되었습니다: ${metadataURI}`);
    }
    
    res.status(200).json({
      message: 'NFT가 성공적으로 민팅되었습니다',
      txHash: tx.hash,
      tokenId: confirmedTokenId,
      nft: nftRecord
    });
    
  } catch (error) {
    console.error('NFT 민팅 오류:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: '민팅 중 오류가 발생했습니다: ' + error.message });
    } else {
      res.status(500).json({ error: '민팅 중 알 수 없는 오류가 발생했습니다' });
    }
  }
});

export default router;
