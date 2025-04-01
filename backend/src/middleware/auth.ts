import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

/**
 * JWT 토큰 페이로드 타입 정의
 */
interface JwtPayload {
  userId: number;
  walletAddress: string;
  iat?: number;
  exp?: number;
}

// JWT 토큰으로부터 사용자 정보를 확장한 Request 인터페이스
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        walletAddress: string;
      };
    }
  }
}

/**
 * JWT 토큰을 검증하고 사용자 정보를 req.user에 추가하는 미들웨어
 */
export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  // 쿠키에서 토큰 가져오기
  const token = req.cookies.token;
  
  // 토큰이 없으면 인증 실패
  if (!token) {
    return res.status(401).json({ error: '인증이 필요합니다' });
  }

  try {
    // 토큰 검증
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // req.user에 사용자 정보 추가
    req.user = {
      userId: decoded.userId,
      walletAddress: decoded.walletAddress
    };
    
    next();
  } catch (error: any) {
    console.error('인증 토큰 검증 실패:', error);
    
    // 토큰 만료 에러 구분
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '토큰이 만료되었습니다. 다시 로그인해주세요.' });
    }
    
    return res.status(401).json({ error: '유효하지 않은 토큰입니다' });
  }
};

/**
 * 선택적 인증 미들웨어 - 토큰이 있으면 검증하고 없어도 통과
 * 블로그 뷰, 캐릭터 리스트, 공개 API 등에 사용하기 적합
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;
  
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = {
      userId: decoded.userId,
      walletAddress: decoded.walletAddress
    };
  } catch (error: any) {
    // 토큰이 유효하지 않아도 오류를 반환하지 않고 계속 진행
    if (error.name === 'TokenExpiredError') {
      console.warn('토큰이 만료되었지만 선택적 인증으로 계속 진행');
    } else {
      console.warn('유효하지 않은 토큰이지만 선택적 인증으로 계속 진행');
    }
  }
  
  next();
}; 