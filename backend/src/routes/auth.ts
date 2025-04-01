import express from 'express';
import prisma from '../prismaClient';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

/**
 * @swagger
 * /auth/nonce:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: 지갑 주소에 대한 nonce 발급
 *     description: 사용자의 지갑 주소로 서명 요청에 사용할 nonce를 발급합니다.
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
 *     description: 사용자의 서명을 검증하고 성공 시 JWT 토큰을 발급합니다.
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

export default router; 