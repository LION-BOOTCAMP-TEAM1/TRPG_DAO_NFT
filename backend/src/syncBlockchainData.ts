import { ethers } from 'ethers';
import prisma from './prismaClient';

export async function syncVotedEvents(events: ethers.Event[]) {
  for (const event of events) {
    const [proposalId, voter, option] = event.args as [ethers.BigNumber, string, ethers.BigNumber];
    
    try {
      // Proposal 조회
      const proposal = await prisma.dAOProposal.findUnique({
        where: { proposalId: proposalId.toNumber() }
      });
      
      if (!proposal) {
        console.error(`Proposal ${proposalId} 조회 실패: 존재하지 않는 proposalId`);
        continue;
      }
      
      // Vote 생성/업데이트
      await prisma.dAOVote.upsert({
        where: {
          proposalId_voter: {
            proposalId: proposalId.toNumber(),
            voter
          }
        },
        update: {
          option: option.toNumber()
        },
        create: {
          proposalId: proposalId.toNumber(),
          voter,
          option: option.toNumber()
        }
      });
      
      console.log(`Proposal ${proposalId}에 대한 투표 이벤트 처리됨`);
    } catch (error) {
      console.error('투표 이벤트 처리 오류:', error);
    }
  }
} 