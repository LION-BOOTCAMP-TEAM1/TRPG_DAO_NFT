import express, { Request, Response, RequestHandler } from 'express';
import prisma from '../prismaClient';

const router = express.Router();

/**
 * @swagger
 * /api/playernfts:
 *   get:
 *     summary: 모든 플레이어 NFT 목록을 조회합니다
 *     tags: [PlayerNFTs]
 *     responses:
 *       200:
 *         description: NFT 목록을 반환합니다
 *       500:
 *         description: 서버 오류
 */
const getPlayerNFTs = async (req: Request, res: Response) => {
  try {
    const nfts = await prisma.playerNFT.findMany({
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true
          }
        },
        choice: true
      }
    });
    
    res.json(nfts);
  } catch (error) {
    console.error('NFT 목록 조회 오류:', error);
    res.status(500).json({ error: 'NFT 목록 조회 중 오류가 발생했습니다' });
  }
};

/**
 * @swagger
 * /api/playernfts/user/{userId}:
 *   get:
 *     summary: 특정 사용자의 NFT 목록을 조회합니다
 *     tags: [PlayerNFTs]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 사용자의 NFT 목록을 반환합니다
 *       404:
 *         description: 사용자를 찾을 수 없습니다
 *       500:
 *         description: 서버 오류
 */
const getUserNFTs = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const nfts = await prisma.playerNFT.findMany({
      where: { userId: Number(userId) },
      include: {
        choice: {
          include: {
            quest: true
          }
        }
      }
    });

    res.json(nfts);
  } catch (error) {
    console.error('사용자 NFT 조회 오류:', error);
    res.status(500).json({ error: '사용자 NFT 조회 중 오류가 발생했습니다' });
  }
};

/**
 * @swagger
 * /api/playernfts/{id}:
 *   get:
 *     summary: 특정 NFT 정보를 조회합니다
 *     tags: [PlayerNFTs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: NFT ID
 *     responses:
 *       200:
 *         description: NFT 정보를 반환합니다
 *       404:
 *         description: NFT를 찾을 수 없습니다
 *       500:
 *         description: 서버 오류
 */
const getPlayerNFT = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const nft = await prisma.playerNFT.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true
          }
        },
        choice: {
          include: {
            quest: {
              include: {
                story: true
              }
            }
          }
        }
      }
    });

    if (!nft) {
      return res.status(404).json({ error: 'NFT를 찾을 수 없습니다' });
    }

    res.json(nft);
  } catch (error) {
    console.error('NFT 조회 오류:', error);
    res.status(500).json({ error: 'NFT 조회 중 오류가 발생했습니다' });
  }
};

/**
 * @swagger
 * /api/playernfts:
 *   post:
 *     summary: 새로운 플레이어 NFT를 생성합니다
 *     tags: [PlayerNFTs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - nftTokenId
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: 사용자 ID
 *               nftTokenId:
 *                 type: string
 *                 description: 블록체인 NFT 토큰 ID
 *               choiceId:
 *                 type: integer
 *                 description: 관련 선택지 ID (선택 사항)
 *     responses:
 *       201:
 *         description: 생성된 NFT 정보를 반환합니다
 *       400:
 *         description: 잘못된 요청 (필수 정보 누락)
 *       404:
 *         description: 사용자 또는 선택지를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
const createPlayerNFT = async (req: Request, res: Response) => {
  const { userId, nftTokenId, choiceId } = req.body;

  if (!userId || !nftTokenId) {
    return res.status(400).json({ error: '사용자 ID와 NFT 토큰 ID가 필요합니다' });
  }

  try {
    // 유효한 사용자인지 확인
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    // 선택지 ID가 제공된 경우 유효한 선택지인지 확인
    if (choiceId) {
      const choice = await prisma.choice.findUnique({
        where: { id: Number(choiceId) }
      });

      if (!choice) {
        return res.status(404).json({ error: '선택지를 찾을 수 없습니다' });
      }
    }

    // NFT 생성
    const nftData: any = {
      userId: Number(userId),
      nftTokenId
    };

    if (choiceId) {
      nftData.choiceId = Number(choiceId);
    }

    const newNFT = await prisma.playerNFT.create({
      data: nftData,
      include: {
        user: true,
        choice: true
      }
    });

    res.status(201).json(newNFT);
  } catch (error) {
    console.error('NFT 생성 오류:', error);
    res.status(500).json({ error: 'NFT 생성 중 오류가 발생했습니다' });
  }
};

/**
 * @swagger
 * /api/playernfts/verify/{tokenId}:
 *   get:
 *     summary: NFT 토큰 ID의 유효성과 소유권을 확인합니다
 *     tags: [PlayerNFTs]
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *         description: 블록체인 NFT 토큰 ID
 *     responses:
 *       200:
 *         description: NFT 유효성 확인 결과를 반환합니다
 *       404:
 *         description: NFT를 찾을 수 없습니다
 *       500:
 *         description: 서버 오류
 */
const verifyNFT = async (req: Request, res: Response) => {
  const { tokenId } = req.params;

  try {
    const nft = await prisma.playerNFT.findFirst({
      where: { nftTokenId: tokenId },
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true
          }
        }
      }
    });

    if (!nft) {
      return res.status(404).json({ error: 'NFT를 찾을 수 없습니다' });
    }

    // 여기서는 간단히 DB에 있는지만 확인하고 있지만,
    // 실제로는 블록체인에서 소유권 확인 로직을 추가할 수 있습니다

    res.json({
      isValid: true,
      owner: nft.user.walletAddress,
      nft
    });
  } catch (error) {
    console.error('NFT 확인 오류:', error);
    res.status(500).json({ error: 'NFT 확인 중 오류가 발생했습니다' });
  }
};

// 라우터에 핸들러 연결
router.get('/', getPlayerNFTs as RequestHandler);
router.get('/user/:userId', getUserNFTs as RequestHandler);
router.get('/:id', getPlayerNFT as RequestHandler);
router.post('/', createPlayerNFT as RequestHandler);
router.get('/verify/:tokenId', verifyNFT as RequestHandler);

export default router; 