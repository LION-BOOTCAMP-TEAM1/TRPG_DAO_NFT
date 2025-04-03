const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const user = await prisma.user.create({
      data: {
        walletAddress: '0x0000000000000000000000000000000000000001',
        nonce: 'random-nonce-1'
      }
    });
    console.log('Test user created:', user);
    
    const allUsers = await prisma.user.findMany();
    console.log('All users:', allUsers);
  } catch (e) {
    console.error('Error creating user:', e);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser(); 