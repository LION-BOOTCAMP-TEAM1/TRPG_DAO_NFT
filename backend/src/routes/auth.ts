import express from 'express';
import prisma from '../prismaClient';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import { authenticateUser } from '../middleware/auth';


const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

/**
 * @swagger
 * /auth/nonce:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: 지갑 주소에 대한 nonce 발급
 *     description: 사용자의 지갑 주소로 서명 요청에 사용할 nonce를 발급합니다. 사용자가 DB에 없는 경우 자동으로 생성합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *             properties:
 *               address:
 *                 type: string
 *                 description: 사용자의 이더리움 지갑 주소
 *     responses:
 *       200:
 *         description: nonce 발급 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nonce:
 *                   type: string
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/nonce', async (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ error: '지갑 주소가 필요합니다' });
  }

  const nonce = `로그인 서명 요청: ${randomBytes(16).toString('hex')}`;

  try {
    // 사용자가 없으면 자동으로 생성하면서 nonce 설정
    await prisma.user.upsert({
      where: { walletAddress: address },
      update: { nonce },
      create: { walletAddress: address, nonce },
    });

    return res.json({ nonce });
  } catch (error) {
    console.error('Nonce 발급 중 오류 발생:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /auth/verify:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: 서명 검증 및 JWT 토큰 발급
 *     description: 사용자의 서명을 검증하고 성공 시 JWT 토큰을 발급합니다. 이 과정이 완료되면 사용자는 로그인된 상태가 됩니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *               - signature
 *             properties:
 *               address:
 *                 type: string
 *                 description: 사용자의 이더리움 지갑 주소
 *               signature:
 *                 type: string
 *                 description: nonce에 대한 서명값
 *     responses:
 *       200:
 *         description: 인증 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/verify', async (req, res) => {
  const { address, signature } = req.body;

  if (!address || !signature) {
    return res.status(400).json({ error: '지갑 주소와 서명이 필요합니다' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { walletAddress: address } });

    if (!user || !user.nonce) {
      return res.status(400).json({ error: '사용자 또는 nonce를 찾을 수 없습니다' });
    }

    // 서명 검증
    const recovered = ethers.verifyMessage(user.nonce, signature);
    
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: '유효하지 않은 서명입니다' });
    }

    // 서명 OK → 토큰 발급
    const token = jwt.sign(
      { userId: user.id, walletAddress: address }, 
      JWT_SECRET, 
      { expiresIn: '1d' }
    );

    // HttpOnly 쿠키로 저장
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400000, // 1일
    });

    // nonce 초기화 (재사용 방지)
    await prisma.user.update({
      where: { walletAddress: address },
      data: { nonce: null },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('서명 검증 중 오류 발생:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: 현재 인증된 사용자 정보 조회
 *     description: JWT 토큰을 통해 현재 로그인된 사용자 정보를 반환합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: 사용자 ID
 *                     walletAddress:
 *                       type: string
 *                       description: 사용자 지갑 주소
 *       401:
 *         description: 인증되지 않은 사용자
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/me', authenticateUser, async (req, res) => {
  try {
    // authenticateUser 미들웨어에서 req.user에 사용자 정보를 이미 추가했습니다
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '인증되지 않은 사용자입니다' });
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        walletAddress: true,
        createdAt: true,
        // 필요한 정보만 선택적으로 가져오기
      }
    });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('사용자 정보 조회 중 오류 발생:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: 로그아웃
 *     description: 현재 세션을 종료하고 인증 쿠키를 삭제합니다.
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */
router.post('/logout', (req, res) => {
  // 쿠키 삭제
  res.clearCookie('token');
  return res.json({ success: true });
});

export default router; 