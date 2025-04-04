import { prisma } from '../src/utils/prisma-manager';

async function cleanupDuplicateStoryScenes() {
  try {
    console.log('중복된 StoryScene 정리 시작...');
    
    // 모든 스토리 가져오기
    const stories = await prisma.story.findMany({
      select: { id: true }
    });
    
    let totalRemoved = 0;
    
    // 각 스토리별로 중복 처리
    for (const story of stories) {
      // 스토리ID별로 그룹화하여 시퀀스 번호당 가장 먼저 생성된 레코드를 제외한 나머지 찾기
      const dupScenes = await prisma.$queryRaw`
        WITH DuplicateScenes AS (
          SELECT id, 
                ROW_NUMBER() OVER (PARTITION BY "storyId", sequence ORDER BY "createdAt") as row_num
          FROM "StoryScene"
          WHERE "storyId" = ${story.id}
        )
        SELECT id FROM DuplicateScenes WHERE row_num > 1
      `;
      
      // 중복이 발견된 경우에만 삭제 실행
      if (Array.isArray(dupScenes) && dupScenes.length > 0) {
        const idsToRemove = dupScenes.map((scene: any) => scene.id);
        console.log(`스토리 ID ${story.id}: ${idsToRemove.length}개의 중복 씬 발견`);
        
        // 중복 삭제
        const result = await prisma.storyScene.deleteMany({
          where: {
            id: { in: idsToRemove }
          }
        });
        
        console.log(`스토리 ID ${story.id}: ${result.count}개의 중복 씬 삭제 완료`);
        totalRemoved += result.count;
      }
    }
    
    console.log(`중복 정리 완료: 총 ${totalRemoved}개의 중복 씬 삭제됨`);
  } catch (error) {
    console.error('중복 정리 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// BranchPointScene 중복 정리 함수
async function cleanupDuplicateBranchPointScenes() {
  try {
    console.log('중복된 BranchPointScene 정리 시작...');
    
    const branchPoints = await prisma.branchPoint.findMany({
      select: { id: true }
    });
    
    let totalRemoved = 0;
    
    for (const bp of branchPoints) {
      const dupScenes = await prisma.$queryRaw`
        WITH DuplicateScenes AS (
          SELECT id, 
                ROW_NUMBER() OVER (PARTITION BY "branchPointId", "order" ORDER BY id) as row_num
          FROM "BranchPointScene"
          WHERE "branchPointId" = ${bp.id}
        )
        SELECT id FROM DuplicateScenes WHERE row_num > 1
      `;
      
      if (Array.isArray(dupScenes) && dupScenes.length > 0) {
        const idsToRemove = dupScenes.map((scene: any) => scene.id);
        console.log(`브랜치포인트 ID ${bp.id}: ${idsToRemove.length}개의 중복 씬 발견`);
        
        const result = await prisma.branchPointScene.deleteMany({
          where: {
            id: { in: idsToRemove }
          }
        });
        
        console.log(`브랜치포인트 ID ${bp.id}: ${result.count}개의 중복 씬 삭제 완료`);
        totalRemoved += result.count;
      }
    }
    
    console.log(`중복 정리 완료: 총 ${totalRemoved}개의 중복 브랜치포인트 씬 삭제됨`);
  } catch (error) {
    console.error('중복 정리 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Quest 중복 정리 함수
async function cleanupDuplicateQuests() {
  try {
    console.log('중복된 Quest 정리 시작...');
    
    const stories = await prisma.story.findMany({
      select: { id: true }
    });
    
    let totalRemoved = 0;
    
    for (const story of stories) {
      const dupQuests = await prisma.$queryRaw`
        WITH DuplicateQuests AS (
          SELECT id, 
                ROW_NUMBER() OVER (PARTITION BY "storyId", slug ORDER BY id) as row_num
          FROM "Quest"
          WHERE "storyId" = ${story.id}
        )
        SELECT id FROM DuplicateQuests WHERE row_num > 1
      `;
      
      if (Array.isArray(dupQuests) && dupQuests.length > 0) {
        const idsToRemove = dupQuests.map((quest: any) => quest.id);
        console.log(`스토리 ID ${story.id}: ${idsToRemove.length}개의 중복 퀘스트 발견`);
        
        const result = await prisma.quest.deleteMany({
          where: {
            id: { in: idsToRemove }
          }
        });
        
        console.log(`스토리 ID ${story.id}: ${result.count}개의 중복 퀘스트 삭제 완료`);
        totalRemoved += result.count;
      }
    }
    
    console.log(`중복 정리 완료: 총 ${totalRemoved}개의 중복 퀘스트 삭제됨`);
  } catch (error) {
    console.error('중복 정리 중 오류 발생:', error);
  }
}

// Choice 중복 정리 함수
async function cleanupDuplicateChoices() {
  try {
    console.log('중복된 Choice 정리 시작...');
    
    const quests = await prisma.quest.findMany({
      select: { id: true }
    });
    
    let totalRemoved = 0;
    
    for (const quest of quests) {
      const dupChoices = await prisma.$queryRaw`
        WITH DuplicateChoices AS (
          SELECT id, 
                ROW_NUMBER() OVER (PARTITION BY "questId", slug ORDER BY id) as row_num
          FROM "Choice"
          WHERE "questId" = ${quest.id}
        )
        SELECT id FROM DuplicateChoices WHERE row_num > 1
      `;
      
      if (Array.isArray(dupChoices) && dupChoices.length > 0) {
        const idsToRemove = dupChoices.map((choice: any) => choice.id);
        console.log(`퀘스트 ID ${quest.id}: ${idsToRemove.length}개의 중복 선택지 발견`);
        
        const result = await prisma.choice.deleteMany({
          where: {
            id: { in: idsToRemove }
          }
        });
        
        console.log(`퀘스트 ID ${quest.id}: ${result.count}개의 중복 선택지 삭제 완료`);
        totalRemoved += result.count;
      }
    }
    
    console.log(`중복 정리 완료: 총 ${totalRemoved}개의 중복 선택지 삭제됨`);
  } catch (error) {
    console.error('중복 정리 중 오류 발생:', error);
  }
}

// DAOChoice 중복 정리 함수
async function cleanupDuplicateDAOChoices() {
  try {
    console.log('중복된 DAOChoice 정리 시작...');
    
    const branchPoints = await prisma.branchPoint.findMany({
      select: { id: true }
    });
    
    let totalRemoved = 0;
    
    for (const bp of branchPoints) {
      const dupChoices = await prisma.$queryRaw`
        WITH DuplicateChoices AS (
          SELECT id, 
                ROW_NUMBER() OVER (PARTITION BY "branchPointId", text ORDER BY id) as row_num
          FROM "DAOChoice"
          WHERE "branchPointId" = ${bp.id}
        )
        SELECT id FROM DuplicateChoices WHERE row_num > 1
      `;
      
      if (Array.isArray(dupChoices) && dupChoices.length > 0) {
        const idsToRemove = dupChoices.map((choice: any) => choice.id);
        console.log(`브랜치포인트 ID ${bp.id}: ${idsToRemove.length}개의 중복 DAO 선택지 발견`);
        
        const result = await prisma.dAOChoice.deleteMany({
          where: {
            id: { in: idsToRemove }
          }
        });
        
        console.log(`브랜치포인트 ID ${bp.id}: ${result.count}개의 중복 DAO 선택지 삭제 완료`);
        totalRemoved += result.count;
      }
    }
    
    console.log(`중복 정리 완료: 총 ${totalRemoved}개의 중복 DAO 선택지 삭제됨`);
  } catch (error) {
    console.error('중복 정리 중 오류 발생:', error);
  }
}

// ChoiceCondition 중복 정리 함수
async function cleanupDuplicateChoiceConditions() {
  try {
    console.log('중복된 ChoiceCondition 정리 시작...');
    
    const choices = await prisma.choice.findMany({
      select: { id: true }
    });
    
    let totalRemoved = 0;
    
    for (const choice of choices) {
      const dupConditions = await prisma.$queryRaw`
        WITH DuplicateConditions AS (
          SELECT id, 
                ROW_NUMBER() OVER (PARTITION BY "choiceId" ORDER BY id) as row_num
          FROM "ChoiceCondition"
          WHERE "choiceId" = ${choice.id}
        )
        SELECT id FROM DuplicateConditions WHERE row_num > 1
      `;
      
      if (Array.isArray(dupConditions) && dupConditions.length > 0) {
        const idsToRemove = dupConditions.map((condition: any) => condition.id);
        console.log(`선택지 ID ${choice.id}: ${idsToRemove.length}개의 중복 조건 발견`);
        
        const result = await prisma.choiceCondition.deleteMany({
          where: {
            id: { in: idsToRemove }
          }
        });
        
        console.log(`선택지 ID ${choice.id}: ${result.count}개의 중복 조건 삭제 완료`);
        totalRemoved += result.count;
      }
    }
    
    console.log(`중복 정리 완료: 총 ${totalRemoved}개의 중복 선택지 조건 삭제됨`);
  } catch (error) {
    console.error('중복 정리 중 오류 발생:', error);
  }
}

// 메인 함수 - 모든 테이블 정리
async function cleanupAllDuplicates() {
  try {
    // 파라미터 파싱
    const args = process.argv.slice(2);
    const specificType = args.find(arg => arg.startsWith('--type='))?.split('=')[1];
    const shouldExportJson = args.includes('--export=json');
    const reportOnly = args.includes('--report');
    
    if (specificType) {
      console.log(`지정된 타입: ${specificType} 중복 정리 시작`);
      switch (specificType) {
        case 'story-scenes':
          await cleanupDuplicateStoryScenes();
          break;
        case 'branch-scenes':
          await cleanupDuplicateBranchPointScenes();
          break;
        case 'quests':
          await cleanupDuplicateQuests();
          break;
        case 'choices':
          await cleanupDuplicateChoices();
          break;
        case 'dao-choices':
          await cleanupDuplicateDAOChoices();
          break;
        case 'choice-conditions':
          await cleanupDuplicateChoiceConditions();
          break;
        default:
          console.log(`알 수 없는 타입: ${specificType}. 모든 테이블 정리를 진행합니다.`);
          await runAllCleanups();
      }
    } else {
      // 모든 정리 함수 실행
      await runAllCleanups();
    }
    
    console.log('모든 테이블 중복 정리 완료');
  } catch (error) {
    console.error('중복 정리 과정에서 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function runAllCleanups() {
  await cleanupDuplicateStoryScenes();
  await cleanupDuplicateBranchPointScenes();
  await cleanupDuplicateQuests();
  await cleanupDuplicateChoices();
  await cleanupDuplicateDAOChoices();
  await cleanupDuplicateChoiceConditions();
}

// 스크립트 실행
cleanupAllDuplicates()
  .then(() => {
    console.log('중복 정리 스크립트 완료');
    process.exit(0);
  })
  .catch(error => {
    console.error('스크립트 실행 오류:', error);
    process.exit(1);
  });
