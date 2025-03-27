import express, { Request, Response, RequestHandler } from 'express';
import prisma from '../prismaClient';

const router = express.Router();

// ID 또는 슬러그로 분기점을 찾는 유틸리티 함수
async function findBranchPointByIdOrSlug(idOrSlug: string) {
  // 숫자인지 확인
  const isNumber = /^\d+$/.test(idOrSlug);
  
  if (isNumber) {
    return await prisma.branchPoint.findUnique({
      where: { id: Number(idOrSlug) }
    });
  } else {
    return await prisma.branchPoint.findUnique({
      where: { slug: idOrSlug }
    });
  }
}

/**
 * @swagger
 * /api/branchpoints:
 *   get:
 *     summary: 모든 분기점 정보를 조회합니다
 *     tags: [BranchPoint]
 *     responses:
 *       200:
 *         description: 모든 분기점 정보 목록을 반환합니다
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   slug:
 *                     type: string
 *                   storyId:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   status:
 *                     type: string
 *                     enum: [OPEN, CLOSED]
 *                   daoVoteId:
 *                     type: string
 *                   BranchPointScene:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         order:
 *                           type: integer
 *                         text:
 *                           type: string
 *       500:
 *         description: 서버 오류
 */
const getAllBranchPoints = async (_req: Request, res: Response) => {
  try {
    const branchPoints = await prisma.branchPoint.findMany({
      include: {
        BranchPointScene: {
          orderBy: { order: 'asc' }
        },
        DAOChoice: true // DAO 선택지도 함께 가져오기
      }
    });
    
    res.json(branchPoints);
  } catch (error) {
    console.error('모든 분기점 조회 오류:', error);
    res.status(500).json({ error: '분기점 조회 중 오류가 발생했습니다' });
  }
};

/**
 * @swagger
 * /api/branchpoints/{idOrSlug}:
 *   get:
 *     summary: DAO 투표 결과 및 분기점 정보를 조회합니다
 *     tags: [BranchPoint]
 *     parameters:
 *       - in: path
 *         name: idOrSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: 분기점 ID 또는 슬러그
 *     responses:
 *       200:
 *         description: 분기점 정보와 DAO 투표 결과를 반환합니다
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 slug:
 *                   type: string
 *                 storyId:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [OPEN, CLOSED]
 *                 daoVoteId:
 *                   type: string
 *                 BranchPointScene:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       order:
 *                         type: integer
 *                       text:
 *                         type: string
 *                 DAOChoice:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       text:
 *                         type: string
 *                       nextStoryId:
 *                         type: integer
 *                       voteCount:
 *                         type: integer
 *       404:
 *         description: 분기점을 찾을 수 없습니다
 *       500:
 *         description: 서버 오류
 */
const getBranchPoint = async (req: Request, res: Response) => {
  const { idOrSlug } = req.params;

  try {
    // ID 또는 슬러그로 분기점 기본 정보 찾기
    const branchPointBase = await findBranchPointByIdOrSlug(idOrSlug);
    
    if (!branchPointBase) {
      return res.status(404).json({ error: '분기점을 찾을 수 없습니다' });
    }
    
    // 찾은 분기점의 ID로 상세 정보 조회
    const branchPoint = await prisma.branchPoint.findUnique({
      where: { id: branchPointBase.id },
      include: {
        BranchPointScene: {
          orderBy: {
            order: 'asc'
          }
        },
        DAOChoice: true // DAO 선택지도 함께 가져오기
      }
    });

    res.json(branchPoint);
  } catch (error) {
    console.error('분기점 조회 오류:', error);
    res.status(500).json({ error: '분기점 조회 중 오류가 발생했습니다' });
  }
};

// 라우터에 핸들러 연결
router.get('/:idOrSlug', getBranchPoint as RequestHandler);
router.get('/', getAllBranchPoints as RequestHandler);

export default router; 