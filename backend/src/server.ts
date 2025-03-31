import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import prisma from './prismaClient';
import { setupSwagger } from './config/swagger';
import apiRoutes from './routes';
import { syncDatabase } from './utils/dbSync';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const API_PREFIX = '/api';

// CORS 설정
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://crpg.xyz' 
    : 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 정적 파일 제공 설정
app.use('/static', express.static(path.join(__dirname, '../static')));

setupSwagger(app);

// API 라우터 등록
app.use(API_PREFIX, apiRoutes);

// 데이터베이스 동기화 후 서버 시작
async function startServer() {
  try {
    console.log('데이터베이스 연결 확인 중...');
    
    // 개발 환경에서만 자동 확인 요청, 프로덕션에서는 autoApprove: true로 설정하여 자동 적용
    const isProduction = process.env.NODE_ENV === 'production';
    
    await syncDatabase({
      forceMigrate: false, // 강제 마이그레이션 적용 여부 
      seed: false,         // 시드 데이터 적용 여부 (필요시 true로 변경)
      autoApprove: isProduction // 개발 환경에서는 확인 메시지 표시, 프로덕션에서는 자동 승인
    });
    
    // 데이터베이스 연결 테스트
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ 데이터베이스 연결 성공!');
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
    
    // 애플리케이션 종료 시 데이터베이스 연결 정상 종료
    const gracefulShutdown = async () => {
      console.log('서버를 종료합니다...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('데이터베이스 연결이 안전하게 종료되었습니다.');
        process.exit(0);
      });
    };
    
    // SIGTERM, SIGINT 시그널 처리
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    console.error('서버 시작 중 오류가 발생했습니다:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
