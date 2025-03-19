import express, { Request, Response, RequestHandler } from 'express';
import prisma from '../prismaClient';

const router = express.Router();

/**
 * @swagger
 * /api/branchpoint/{id}:
 *   get:
 *     summary: DAO 투표 결과 및 분기점 정보를 조회합니다
 *     tags: [BranchPoint]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 분기점 ID
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
 *                 storyId:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [open, closed]
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
 *       404:
 *         description: 분기점을 찾을 수 없습니다
 *       500:
 *         description: 서버 오류
 */
const getBranchPoint = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const branchPoint = await prisma.branchPoint.findUnique({
      where: { id: Number(id) },
      include: {
        BranchPointScene: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

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

export default router; 