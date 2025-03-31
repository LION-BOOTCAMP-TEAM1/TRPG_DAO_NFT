import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

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
