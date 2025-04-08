import { queueNFTMint } from './nftService';
import { prisma } from '../utils/prisma-manager';

// 퀘스트 완료 시 NFT 민팅 요청
export async function completeQuest(userId: number, questId: number, sessionId: number) {
  try {
    // 퀘스트 정보 조회
    const quest = await prisma.quest.findUnique({
      where: { id: questId },
      include: { 
        chapter: true,
        story: true 
      }
    });
    
    if (!quest) {
      throw new Error('퀘스트를 찾을 수 없습니다');
    }
    
    // 유저 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user || !user.walletAddress) {
      throw new Error('유저 지갑 주소를 찾을 수 없습니다');
    }
    
    // 퀘스트 완료 기록
    await prisma.userAction.create({
      data: {
        userId,
        questId,
        result: 'COMPLETED'
      }
    });
    
    // NFT 민팅 여부 결정 (예: 특별한 퀘스트, 랜덤 확률 등)
    const shouldMintNFT = quest.title.includes('특별') || Math.random() < 0.2;
    
    if (shouldMintNFT) {
      // NFT 메타데이터 생성
      const metadata = {
        name: `${quest.title} 완료 기념품`,
        description: `${quest.story.title}의 ${quest.title} 퀘스트를 완료하여 얻은 특별 아이템`,
        image: `https://example.com/nft-images/${quest.id}.png`,
        attributes: [
          { trait_type: "Quest", value: quest.title },
          { trait_type: "Chapter", value: quest.chapter?.title || "없음" },
          { trait_type: "Story", value: quest.story.title },
          { trait_type: "Rarity", value: determineRarity() }
        ]
      };
      
      // NFT 민팅 요청
      await queueNFTMint(
        userId,
        user.walletAddress,
        metadata,
        'QUEST_COMPLETION',
        sessionId,
        questId
      );
      
      return { questCompleted: true, nftMinted: true };
    }
    
    return { questCompleted: true, nftMinted: false };
  } catch (error) {
    console.error('퀘스트 완료 처리 오류:', error);
    throw error;
  }
}

// 세션 종료 시 NFT 민팅
export async function completeSession(sessionId: number) {
  try {
    // 세션 정보 조회
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { 
        participants: {
          include: { user: true }
        },
        storyWorld: true
      }
    });
    
    if (!session) {
      throw new Error('세션을 찾을 수 없습니다');
    }
    
    // 세션 상태 업데이트
    await prisma.session.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED' }
    });
    
    // 각 참가자에게 NFT 발행
    for (const participant of session.participants) {
      const user = participant.user;
      
      if (!user.walletAddress) continue;
      
      // NFT 메타데이터 생성
      const metadata = {
        name: `${session.name} 참가 증명서`,
        description: `${session.storyWorld.title} 세계관의 ${session.name} 세션 참가 기념 NFT`,
        image: `https://example.com/session-nft/${sessionId}.png`,
        attributes: [
          { trait_type: "Session", value: session.name },
          { trait_type: "StoryWorld", value: session.storyWorld.title },
          { trait_type: "Role", value: participant.role || "Player" },
          { trait_type: "Completion Date", value: new Date().toISOString().split('T')[0] }
        ]
      };
      
      // NFT 민팅 요청
      await queueNFTMint(
        user.id,
        user.walletAddress,
        metadata,
        'SESSION_COMPLETION',
        sessionId
      );
    }
    
    return { sessionCompleted: true, participantCount: session.participants.length };
  } catch (error) {
    console.error('세션 완료 처리 오류:', error);
    throw error;
  }
}

// 희귀도 결정 함수 (랜덤)
function determineRarity() {
  const rand = Math.random();
  if (rand < 0.01) return "Legendary";
  if (rand < 0.05) return "Epic";
  if (rand < 0.15) return "Rare";
  if (rand < 0.40) return "Uncommon";
  return "Common";
}
