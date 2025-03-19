import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import prisma from './prismaClient';
import { setupSwagger } from './config/swagger';
import apiRoutes from './routes';
import { syncDatabase } from './utils/dbSync';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const API_PREFIX = '/api';

// CORS 설정
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

setupSwagger(app);

// API 라우터 등록
app.use(API_PREFIX, apiRoutes);

// 데이터베이스 동기화 후 서버 시작
async function startServer() {
  try {
    // 개발 환경에서만 자동 확인 요청, 프로덕션에서는 autoApprove: true로 설정하여 자동 적용
    const isProduction = process.env.NODE_ENV === 'production';
    
    await syncDatabase({
      forceMigrate: false, // 강제 마이그레이션 적용 여부 
      seed: false,         // 시드 데이터 적용 여부 (필요시 true로 변경)
      autoApprove: isProduction // 개발 환경에서는 확인 메시지 표시, 프로덕션에서는 자동 승인
    });
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('서버 시작 중 오류가 발생했습니다:', error);
    process.exit(1);
  }
}

startServer();
