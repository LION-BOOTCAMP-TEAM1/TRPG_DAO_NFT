import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express, Request, Response, NextFunction } from 'express';

// 기본 인증 미들웨어 함수
function basicAuth(req: Request, res: Response, next: NextFunction) {
  // 인증 헤더가 없으면 인증 요청
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic');
    return res.status(401).send('Authentication required');
  }
  
  // Basic Auth 헤더 파싱
  const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
  const user = auth[0];
  const pass = auth[1];
  
  // 환경 변수에서 사용자 이름과 비밀번호 확인
  // 기본값 설정으로 환경 변수가 없어도 접근 가능하게 함
  const username = process.env.DOCS_USERNAME || 'admin';
  const password = process.env.DOCS_PASSWORD || 'password';
  
  if (user === username && pass === password) {
    return next();
  }
  
  // 인증 실패
  res.setHeader('WWW-Authenticate', 'Basic');
  return res.status(401).send('Authentication failed');
}

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TRPG DAO NFT API',
      version: '1.0.0',
      description: 'TRPG DAO 기반 NFT 게임 API 문서',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://trpg-dao-nft.onrender.com' 
          : 'http://localhost:5001',
        description: process.env.NODE_ENV === 'production' ? '프로덕션 서버' : '개발 서버',
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKey: {
          type: 'apiKey',
          name: 'x-api-key',
          in: 'header',
          description: '관리자 API 키 (ADMIN_API_KEY)',
        }
      }
    }
  },
  apis: ['./src/server.ts', './src/routes/*.ts', './src/routes/**/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  // 기본적으로 인증 비활성화로 변경하고, 명시적으로 AUTH_ENABLE=true일 때만 인증 활성화
  if (process.env.NODE_ENV === 'production' && process.env.AUTH_ENABLE === 'true') {
    app.use('/api-docs', basicAuth);
  }
  
  app.use('/api-docs', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
  });
  
  // 타입 어설션으로 타입 문제 해결 (Express 버전 호환성 이슈)
  (app as any).use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  
  // Swagger JSON 엔드포인트 추가 (선택사항)
  app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}
