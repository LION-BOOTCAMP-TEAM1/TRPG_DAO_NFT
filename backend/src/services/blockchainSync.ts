import { ethers } from 'ethers';
import DAOABI from '../../../frontend/src/utils/abis/DAO.json';
import prisma from '../prismaClient';

// 프로바이더 및 컨트랙트 설정
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const DAO_CONTRACT_ADDRESS = process.env.DAO_CONTRACT_ADDRESS || '0x0'; // 기본값 추가
const daoContract = new ethers.Contract(
  DAO_CONTRACT_ADDRESS, 
  DAOABI,
  provider
);

// 이벤트 리스너 설정
export function setupEventListeners() {
  // Proposal 생성 이벤트 리스닝
  daoContract.on('ProposalCreated', async (proposalId, description, voteEndTime) => {
    try {
      // DB에 proposal 저장
      const activeSession = await prisma.session.findFirst({
        where: { status: 'IN_PROGRESS' },
        orderBy: { createdAt: 'desc' }
      });
      const sessionId = activeSession?.id || 1; // 활성 세션이 없으면 기본값 사용
      await prisma.dAOProposal.create({
        data: {
          proposalId: proposalId.toNumber(),
          description,
          voteEndTime: new Date(voteEndTime.toNumber() * 1000),
          status: 'ACTIVE',
          sessionId
        }
      });
      console.log(`Proposal ${proposalId} 생성 이벤트 처리됨`);
    } catch (error) {
      console.error('Proposal 이벤트 처리 오류:', error);
    }
  });

  // Proposal 종료 이벤트 리스닝
  daoContract.on('ProposalClosed', async (proposalId) => {
    try {
      await prisma.dAOProposal.update({
        where: { proposalId: proposalId.toNumber() },
        data: { status: 'CLOSED' }
      });
      console.log(`Proposal ${proposalId} 종료 이벤트 처리됨`);
    } catch (error) {
      console.error('Proposal 종료 이벤트 처리 오류:', error);
    }
  });

  // 투표 이벤트 리스닝
  daoContract.on('Voted', async (proposalId, voter, option) => {
    try {
      // 먼저 해당 proposal을 조회하여 sessionId를 확인
      const proposal = await prisma.dAOProposal.findUnique({
        where: { proposalId: proposalId.toNumber() }
      });
      
      if (!proposal) {
        console.error(`Proposal ${proposalId} 조회 실패: 존재하지 않는 proposalId`);
        return;
      }
      
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
  });
}

// 폴링 방식 동기화 코드 (선택적으로 사용)
let lastSyncedBlock = 0;

export async function syncBlockchainData() {
  try {
    // 현재 블록 번호 확인
    const currentBlock = await provider.getBlockNumber();
    
    if (lastSyncedBlock === 0) {
      // 첫 실행시 DB에서 마지막 동기화 블록 가져오기
      const syncState = await prisma.syncState.findFirst();
      lastSyncedBlock = syncState?.lastBlock || currentBlock - 1000; // 처음이면 1000블록만 확인
    }
    
    console.log(`동기화 시작: ${lastSyncedBlock} → ${currentBlock}`);
    
    // 이벤트 필터 생성
    const proposalCreatedFilter = daoContract.filters.ProposalCreated();
    const proposalClosedFilter = daoContract.filters.ProposalClosed();
    const votedFilter = daoContract.filters.Voted();
    
    // 각 이벤트 쿼리 및 처리
    const createdEvents = await daoContract.queryFilter(proposalCreatedFilter, lastSyncedBlock, currentBlock);
    const closedEvents = await daoContract.queryFilter(proposalClosedFilter, lastSyncedBlock, currentBlock);
    const votedEvents = await daoContract.queryFilter(votedFilter, lastSyncedBlock, currentBlock);
    
    // 이벤트 처리 로직 (실제 구현)
    for (const event of createdEvents) {
      const args = event.args as [ethers.BigNumber, string, ethers.BigNumber];
      if (!args) continue;
      
      const [proposalId, description, voteEndTime] = args;
      try {
        // 활성 세션 찾기
        const activeSession = await prisma.session.findFirst({
          where: { status: 'IN_PROGRESS' },
          orderBy: { createdAt: 'desc' }
        });
        const sessionId = activeSession?.id || 1; // 활성 세션이 없으면 기본값 사용
        
        // DB에 proposal 저장
        await prisma.dAOProposal.create({
          data: {
            proposalId: proposalId.toNumber(),
            description,
            voteEndTime: new Date(voteEndTime.toNumber() * 1000),
            status: 'ACTIVE',
            sessionId
          }
        });
        console.log(`Proposal ${proposalId} 생성 이벤트 처리됨`);
      } catch (error) {
        console.error('Proposal 생성 이벤트 처리 오류:', error);
      }
    }
    
    for (const event of closedEvents) {
      const args = event.args as [ethers.BigNumber];
      if (!args) continue;
      
      const [proposalId] = args;
      try {
        await prisma.dAOProposal.update({
          where: { proposalId: proposalId.toNumber() },
          data: { status: 'CLOSED' }
        });
        console.log(`Proposal ${proposalId} 종료 이벤트 처리됨`);
      } catch (error) {
        console.error('Proposal 종료 이벤트 처리 오류:', error);
      }
    }
    
    for (const event of votedEvents) {
      const args = event.args as [ethers.BigNumber, string, ethers.BigNumber];
      if (!args) continue;
      
      const [proposalId, voter, option] = args;
      try {
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
    
    // 동기화 상태 업데이트
    await prisma.syncState.upsert({
      where: { id: 1 },
      update: { lastBlock: currentBlock },
      create: { id: 1, lastBlock: currentBlock }
    });
    
    lastSyncedBlock = currentBlock;
  } catch (error) {
    console.error('블록체인 동기화 오류:', error);
  }
}

// 5분마다 동기화 실행
export function startSyncSchedule() {
  setInterval(syncBlockchainData, 5 * 60 * 1000);
  syncBlockchainData(); // 초기 실행
}
