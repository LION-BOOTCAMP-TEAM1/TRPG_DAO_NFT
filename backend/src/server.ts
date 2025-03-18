import express, { RequestHandler, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import prisma from './prismaClient';

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

app.use(API_PREFIX, (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

const handleAsync = (fn: RequestHandler): RequestHandler => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

const createUser = async (req: express.Request, res: express.Response) => {
  const { wallet } = req.body;

  if (!wallet) {
    res.status(400).json({ error: 'Wallet address is required' });
    return;
  }

  const newUser = await prisma.user.create({
    data: { walletAddress: wallet },
  });
  
  res.status(201).json(newUser);
};

const getUsers = async (req: express.Request, res: express.Response) => {
  const users = await prisma.user.findMany();
  res.json(users);
};

app.get(`${API_PREFIX}/users`, handleAsync(getUsers));
app.post(`${API_PREFIX}/users`, handleAsync(createUser));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
