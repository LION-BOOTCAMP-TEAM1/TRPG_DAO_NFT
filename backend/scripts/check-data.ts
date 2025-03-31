import prisma from '../src/prismaClient';

async function checkData() {
  try {
    console.log('프로덕션 데이터베이스 연결 시도 중...');
    
    // 데이터베이스 연결 테스트
    await prisma.$queryRaw`SELECT 1`;
    console.log('데이터베이스 연결 성공!');
    
    // BranchPoint 데이터 확인
    const branchPoints = await prisma.branchPoint.findMany({
      include: {
        BranchPointScene: true,
        DAOChoice: true,
        story: {
          select: {
            id: true,
            slug: true,
            title: true
          }
        }
      }
    });
    
    console.log(`BranchPoint 데이터 개수: ${branchPoints.length}`);
    
    if (branchPoints.length > 0) {
      console.log('브랜치포인트 데이터 요약:');
      branchPoints.forEach(bp => {
        console.log(`- ID: ${bp.id}, 제목: ${bp.title}, 장면 개수: ${bp.BranchPointScene.length}, 선택지 개수: ${bp.DAOChoice.length}`);
        console.log(`  스토리: ${bp.story.title} (${bp.story.slug})`);
      });
    } else {
      console.log('브랜치포인트 데이터가 없습니다.');
      
      // 기타 테이블 데이터 확인
      const storiesCount = await prisma.story.count();
      const choicesCount = await prisma.choice.count();
      const questsCount = await prisma.quest.count();
      const daoChoicesCount = await prisma.dAOChoice.count();
      
      console.log(`다른 테이블 데이터 정보:`);
      console.log(`- 스토리 개수: ${storiesCount}`);
      console.log(`- 퀘스트 개수: ${questsCount}`);
      console.log(`- 선택지 개수: ${choicesCount}`);
      console.log(`- DAO 선택지 개수: ${daoChoicesCount}`);
    }
  } catch (error) {
    console.error('데이터 확인 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData(); 