import express, { Request, Response, RequestHandler } from 'express';
import prisma from '../prismaClient';

const router = express.Router();

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
 *           oneOf:
 *             - type: integer
 *             - type: string
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
  const { id } = req.params;

  try {
    let branchPoint;
    
    // ID가 숫자인지 확인 (이전 코드와의 호환성을 위해)
    if (!isNaN(Number(id)) && String(Number(id)) === id) {
      branchPoint = await prisma.branchPoint.findUnique({
        where: { id: Number(id) },
        include: {
          BranchPointScene: {
            orderBy: {
              order: 'asc'
            }
          },
          DAOChoice: true // DAO 선택지도 함께 가져오기
        }
      });
    } else {
      // slug로 검색
      branchPoint = await prisma.branchPoint.findUnique({
        where: { slug: id }, // id 매개변수는 실제로 slug 값입니다
        include: {
          BranchPointScene: {
            orderBy: {
              order: 'asc'
            }
          },
          DAOChoice: true // DAO 선택지도 함께 가져오기
        }
      });
    }

    if (!branchPoint) {
      return res.status(404).json({ error: '분기점을 찾을 수 없습니다' });
    }

    res.json(branchPoint);
  } catch (error) {
    console.error('분기점 조회 오류:', error);
    res.status(500).json({ error: '분기점 조회 중 오류가 발생했습니다' });
  }
};

// 라우터에 핸들러 연결
router.get('/:id', getBranchPoint as RequestHandler);
router.get('/', getAllBranchPoints as RequestHandler);

export default router; 