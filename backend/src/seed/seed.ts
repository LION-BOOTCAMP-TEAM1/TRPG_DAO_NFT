import { BranchPointStatus, ItemRarity, ItemType } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { prisma } from '../utils/prisma-manager'; // prisma-manager에서 인스턴스 가져오기

// 환경 변수 로드
dotenv.config();

// Import seed data
import stories from './stories.json';
import quests from './quests.json';
import choices from './choices.json';
import storyScenes from './storyScenes.json';
import branchPoints from './branchPoints.json';
import branchPointScenes from './branchPointScenes.json';
import daoChoices from './daoChoices.json';
import storyProgress from './storyProgress.json';
import rewards from './rewards.json';
import storyWorlds from './storyWorlds.json';
import chapters from './chapters.json';
import items from './items.json';
import genres from './genres.json';
import choiceConditions from './choiceCondition.json';
import characterClasses from './characterClasses.json';

// const prisma = new PrismaClient(); // 제거: 개별 인스턴스 생성

// 환경 변수로 중복 데이터 처리 방식 제어
// SEED_OVERWRITE=true: 중복 데이터 덮어쓰기 (기본값)
// SEED_OVERWRITE=false: 중복 데이터 건너뛰기
const OVERWRITE_DUPLICATES = process.env.SEED_OVERWRITE !== 'false';

// 중복 체크 카운터
let duplicatesFound = 0;
let newItemsCreated = 0;
let updatedItems = 0;
let skippedItems = 0;

// 배치 처리를 위한 상수
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '10', 10); // 한 번에 처리할 항목 수
const BATCH_DELAY = parseInt(process.env.BATCH_DELAY || '1000', 10); // 배치 간 지연 시간 (밀리초)

// 배치 처리를 위한 유틸리티 함수
async function processBatch<T>(
  items: T[],
  processFn: (item: T) => Promise<any>,
  entityName: string
) {
  console.log(`${entityName} 배치 처리 시작 - 총 ${items.length}개 항목`);
  
  // 배치로 나누기
  const batches = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    batches.push(items.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`${batches.length}개의 배치로 나눔`);
  
  // 각 배치 처리
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`배치 ${i+1}/${batches.length} 처리 시작 (${batch.length}개 항목)`);
    
    // 병렬로 배치 내 항목 처리
    await Promise.all(batch.map(item => processFn(item)));
    
    if (i < batches.length - 1) {
      console.log(`배치 ${i+1} 완료. ${BATCH_DELAY}ms 대기 중...`);
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }
  
  console.log(`${entityName} 배치 처리 완료`);
}

// 문자열을 URL 친화적인 slug로 변환하는 함수
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '') // 특수문자 제거
    .replace(/ +/g, '-'); // 공백을 하이픈으로 변환
}

// 각 모델의 타입 정의
type Story = {
  id?: number;
  slug: string;
  title: string;
  summary: string;
  quests?: string[];
  branchPoints?: string[];
  imageUrl?: string;
};

type Quest = {
  id?: number;
  slug: string;
  storySlug: string;
  storyId?: number;
  title: string;
  description: string;
  choices?: string[];
  chapterSlug?: string;
};

type Choice = {
  id?: number;
  slug: string;
  questSlug: string;
  questId?: number;
  text: string;
  nextStorySlug: string;
  nextStoryId?: number;
};

type BranchPoint = {
  id?: number;
  slug: string;
  storyId?: number | string;
  storySlug?: string;
  title: string;
  description: string;
  status: string;
  daoVoteId?: string;
  resultChoiceId?: number;
  choices?: { text: string; nextStorySlug: string }[];
};

// 추가: DAOChoice 타입 정의
type DAOChoice = {
  id?: number;
  branchPointId?: number;
  branchPointSlug?: string; // Slug로부터 ID를 찾을 경우
  text: string;
  nextStoryId?: number;
  nextStorySlug?: string;
  voteCount?: number;
};

// 추가: StoryScene과 BranchPointScene 타입 정의
type StoryScene = {
  id?: number;
  storySlug: string;
  sequence: number;
  text: string;
};

type BranchPointScene = {
  id?: number;
  branchPointSlug: string;
  order: number;
  text: string;
};

// 추가: Genre 타입 정의
type Genre = {
  id?: number;
  code: string;
  name: string;
  description?: string;
}

// 추가: StoryWorld 타입 정의
type StoryWorld = {
  id?: number;
  slug: string;
  title: string;
  description: string;
  coverImage?: string;
  genreCode?: string; // 장르 코드 추가
};

// 챕터 타입 정의
type Chapter = {
  id?: number;
  slug: string;
  storySlug?: string;
  storySlugs?: string[];
  storyId?: number;
  title: string;
  description: string;
  sequence: number;
  imageUrl: string;
  questSlugs?: string[];
};

// 아이템 타입 정의
type Item = {
  id?: number;
  code: string;
  name: string;
  description: string;
  imageUrl?: string;
  rarity: ItemRarity;
  itemType: ItemType;
  useEffect?: string;
  statBonus?: Record<string, number>;
  isConsumable: boolean;
  isNFT?: boolean;
};

// 추가: ChoiceCondition 타입 정의
type ChoiceCondition = {
  id?: number;
  choiceSlug: string;
  choiceId?: number;
  classOnly?: string;
  classExclude?: string[]; // Schema에는 없지만 데이터에 있는 필드
  minHealth?: number;
  minStrength?: number;
  minAgility?: number;
  minIntelligence?: number;
  minWisdom?: number;
  minCharisma?: number;
  minHp?: number;
  minMp?: number;
};

// 추가: Reward (PlayerNFT) 타입 정의
type Reward = {
  id?: number;
  userId?: number;
  nftTokenId: string;
  choiceId?: number;
  choiceSlug?: string;
  itemId?: number;
  itemCode?: string;
  createdAt?: string;
  name?: string;
  description?: string;
  rarity?: string;
  ownerId?: number;
};

// 추가: StoryProgress 타입 정의
type StoryProgressData = {
  id?: number;
  userId: number;
  storyId: number;
  storySlug?: string;
  currentQuestId?: number;
  currentQuestSlug?: string;
  currentChapterId?: number;
  currentChapterSlug?: string;
  completed: boolean;
  lastUpdated?: string;
};

// 추가: CharacterClass 타입 정의
type CharacterClass = {
  id?: number;
  code: string;
  name: string;
  description: string;
  recommendedStat1: string;
  recommendedStat2: string;
};

// 중복 확인 및 처리를 위한 커스텀 upsert 함수
async function customUpsert<T extends { id?: number }>(
  model: any,
  where: any,
  data: any,
  entityName: string,
  identifierValue: string | number, // string 또는 number 허용
) {
  // 먼저 해당 데이터가 이미 존재하는지 확인
  const existing = await model.findUnique({
    where
  });

  if (existing) {
    duplicatesFound++;
    
    if (OVERWRITE_DUPLICATES) {
      // 덮어쓰기 모드: 업데이트 실행
      await model.update({
        where: { id: existing.id },
        data
      });
      updatedItems++;
      
      if (duplicatesFound % 10 === 0) { // 로그 줄이기 위해 10개마다 출력
        console.log(`🔄 중복 ${entityName} 업데이트: ${identifierValue} (총 ${duplicatesFound}개 중복 발견)`);
      }
      
      return existing.id;
    } else {
      // 건너뛰기 모드: 업데이트 없이 기존 ID 반환
      skippedItems++;
      
      if (duplicatesFound % 10 === 0) {
        console.log(`⏭️ 중복 ${entityName} 건너뜀: ${identifierValue} (총 ${duplicatesFound}개 중복 발견)`);
      }
      
      return existing.id;
    }
  } else {
    // 새 데이터 생성
    const result = await model.create({
      data
    });
    newItemsCreated++;
    
    if (newItemsCreated % 10 === 0) {
      console.log(`✅ 새 ${entityName} 생성: ${identifierValue} (총 ${newItemsCreated}개 생성)`);
    }
    
    return result.id;
  }
}

// 데이터베이스 시드 함수 (기존 코드를 이 함수로 감싸 외부에서 호출 가능하게 함)
export async function seedDatabase() {
  try {
    console.log('🌱 데이터베이스 시딩 시작...');
    
    console.log('----------------');
    console.log('장르 시딩 중...');
    await seedGenres();
    
    console.log('----------------');
    console.log('캐릭터 클래스 시딩 중...');
    await seedCharacterClasses();
    
    console.log('----------------');
    console.log('스토리 월드 시딩 중...');
    await seedStoryWorlds();
    
    console.log('----------------');
    console.log('챕터 시딩 중...');
    await seedChapters();
    
    console.log('----------------');
    console.log('퀘스트 시딩 중...');
    await seedQuests();
    
    console.log('----------------');
    console.log('선택지 시딩 중...');
    await seedChoices();
    
    console.log('----------------');
    console.log('스토리 씬 시딩 중...');
    await seedStoryScenes();
    
    console.log('----------------');
    console.log('브랜치 포인트 시딩 중...');
    await seedBranchPoints();
    
    console.log('----------------');
    console.log('브랜치 포인트 씬 시딩 중...');
    await seedBranchPointScenes();
    
    console.log('----------------');
    console.log('DAO 선택지 시딩 중...');
    await seedDAOChoices();
    
    console.log('----------------');
    console.log('아이템 시딩 중...');
    await seedItems();
    
    console.log('----------------');
    console.log('선택지 조건 시딩 중...');
    await seedChoiceConditions();
    
    console.log('----------------');
    console.log('보상 시딩 중...');
    await seedRewards();
    
    console.log('🏁 데이터베이스 시딩 완료!');
    console.log(`📊 통계: ${newItemsCreated}개 생성, ${updatedItems}개 업데이트, ${skippedItems}개 건너뜀, ${duplicatesFound}개 중복 발견`);
  } catch (error) {
    console.error('시딩 과정에서 오류 발생:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 각 엔티티별 시드 함수들

// 장르 데이터 시드
export async function seedGenres() {
  const genreCodeToId = new Map();
  
  // 장르 추가
  for (const genre of genres as unknown as Genre[]) {
    const id = await customUpsert(
      prisma.genre,
      { code: genre.code },
      {
        code: genre.code,
        name: genre.name,
        description: genre.description,
      },
      '장르',
      genre.code
    );
    genreCodeToId.set(genre.code, id);
  }
  
  return genreCodeToId;
}

// 스토리 세계관 데이터 시드
export async function seedStoryWorlds() {
  const storyWorldSlugToId = new Map();
  
  // 장르 코드 -> ID 매핑 구축
  const allGenres = await prisma.genre.findMany();
  const genreCodeToId = new Map();
  for (const genre of allGenres) {
    genreCodeToId.set(genre.code, genre.id);
  }
  
  // 스토리 세계관 추가
  for (const storyWorld of storyWorlds as unknown as StoryWorld[]) {
    // 장르 연결 (기본적으로 판타지 장르로 설정, 특정 장르가 명시되어 있으면 해당 장르 사용)
    let genreId = null;
    if (storyWorld.genreCode) {
      genreId = genreCodeToId.get(storyWorld.genreCode);
    } else if (storyWorld.slug.includes('fantasy') || storyWorld.slug.includes('isekai')) {
      // 판타지 관련 세계관은 01-fantasy 장르로 설정
      genreId = genreCodeToId.get('01-fantasy');
    } else if (storyWorld.slug.includes('modern') || storyWorld.slug.includes('city')) {
      // 현대 관련 세계관은 02-modern 장르로 설정
      genreId = genreCodeToId.get('02-modern');
    } else if (storyWorld.slug.includes('cyber') || storyWorld.slug.includes('punk')) {
      // 사이버펑크 관련 세계관은 03-cyberpunk 장르로 설정
      genreId = genreCodeToId.get('03-cyberpunk');
    }

    const id = await customUpsert(
      prisma.storyWorld,
      { slug: storyWorld.slug },
      {
        slug: storyWorld.slug,
        title: storyWorld.title,
        description: storyWorld.description,
        coverImage: storyWorld.coverImage,
        genreId: genreId,
      },
      '스토리 세계관',
      storyWorld.slug
    );
    storyWorldSlugToId.set(storyWorld.slug, id);
  }
  
  return storyWorldSlugToId;
}

// 챕터 데이터 시드
export async function seedChapters() {
  const chapterSlugToId = new Map();
  
  // 스토리 ID 매핑 구축
  const allStories = await prisma.story.findMany();
  const storySlugToId = new Map();
  for (const story of allStories) {
    storySlugToId.set(story.slug, story.id);
  }
  
  // 챕터 추가
  for (const chapter of chapters as unknown as Chapter[]) {
    // 연관된 스토리 ID 찾기
    const storyId = storySlugToId.get(chapter.storySlug || "");
    
    if (!storyId) {
      console.warn(`⚠️ 경고: 챕터 "${chapter.slug}"가 참조하는 스토리 "${chapter.storySlug}"를 찾을 수 없습니다. 건너뜁니다.`);
      continue;
    }
    
    const id = await customUpsert(
      prisma.chapter,
      { slug: chapter.slug },
      {
        slug: chapter.slug,
        title: chapter.title,
        description: chapter.description,
        sequence: chapter.sequence,
        imageUrl: chapter.imageUrl || "https://via.placeholder.com/400x200?text=Chapter+Image",
        storyId: storyId,
      },
      '챕터',
      chapter.slug
    );
    chapterSlugToId.set(chapter.slug, id);
  }
  
  return chapterSlugToId;
}

// 퀘스트 데이터 시드
export async function seedQuests() {
  const questSlugToId = new Map();
  
  // 스토리 및 챕터 ID 매핑 구축
  const allStories = await prisma.story.findMany();
  const storySlugToId = new Map();
  for (const story of allStories) {
    storySlugToId.set(story.slug, story.id);
  }
  
  const allChapters = await prisma.chapter.findMany();
  const chapterSlugToId = new Map();
  for (const chapter of allChapters) {
    chapterSlugToId.set(chapter.slug, chapter.id);
  }
  
  // 퀘스트 추가 - 배치 처리 사용
  await processBatch(
    quests as unknown as Quest[],
    async (quest) => {
      // 연관된 스토리 ID 찾기
      const storyId = storySlugToId.get(quest.storySlug);
      
      if (!storyId) {
        console.warn(`⚠️ 경고: 퀘스트 "${quest.slug}"가 참조하는 스토리 "${quest.storySlug}"를 찾을 수 없습니다. 건너뜁니다.`);
        return;
      }
      
      // 챕터 찾기 (있는 경우)
      let chapterId = null;
      if (quest.chapterSlug) {
        chapterId = chapterSlugToId.get(quest.chapterSlug);
      }
      
      const id = await customUpsert(
        prisma.quest,
        { slug: quest.slug },
        {
          slug: quest.slug,
          title: quest.title,
          description: quest.description,
          storyId: storyId,
          chapterId: chapterId,
        },
        '퀘스트',
        quest.slug
      );
      questSlugToId.set(quest.slug, id);
    },
    '퀘스트'
  );
  
  return questSlugToId;
}

// 선택지(Choice) 데이터 시드
export async function seedChoices() {
  const choiceSlugToId = new Map();
  
  // 퀘스트 및 스토리 ID 매핑 구축
  const allQuests = await prisma.quest.findMany();
  const questSlugToId = new Map();
  for (const quest of allQuests) {
    questSlugToId.set(quest.slug, quest.id);
  }
  
  const allStories = await prisma.story.findMany();
  const storySlugToId = new Map();
  for (const story of allStories) {
    storySlugToId.set(story.slug, story.id);
  }
  
  // 선택지 추가 - 배치 처리 사용
  await processBatch(
    choices as unknown as Choice[],
    async (choice) => {
      // 연관된 퀘스트 ID 찾기
      const questId = questSlugToId.get(choice.questSlug);
      
      if (!questId) {
        console.warn(`⚠️ 경고: 선택지 "${choice.slug}"가 참조하는 퀘스트 "${choice.questSlug}"를 찾을 수 없습니다. 건너뜁니다.`);
        return;
      }
      
      // 다음 스토리 ID 찾기 (있는 경우)
      let nextStoryId = null;
      if (choice.nextStorySlug) {
        nextStoryId = storySlugToId.get(choice.nextStorySlug);
        if (!nextStoryId) {
          console.warn(`⚠️ 경고: 선택지 "${choice.slug}"가 참조하는 다음 스토리 "${choice.nextStorySlug}"를 찾을 수 없습니다.`);
        }
      }
      
      const id = await customUpsert(
        prisma.choice,
        { slug: choice.slug },
        {
          slug: choice.slug,
          text: choice.text,
          questId: questId,
          nextStoryId: nextStoryId,
        },
        '선택지',
        choice.slug
      );
      choiceSlugToId.set(choice.slug, id);
    },
    '선택지'
  );
  
  return choiceSlugToId;
}

// 스토리 씬(StoryScene) 데이터 시드
export async function seedStoryScenes() {
  // 스토리 ID 매핑 구축
  const allStories = await prisma.story.findMany();
  const storySlugToId = new Map();
  for (const story of allStories) {
    storySlugToId.set(story.slug, story.id);
  }
  
  // 스토리 씬 추가 - 배치 처리 사용
  await processBatch(
    storyScenes as unknown as StoryScene[],
    async (scene) => {
      // 연관된 스토리 ID 찾기
      const storyId = storySlugToId.get(scene.storySlug);
      
      if (!storyId) {
        console.warn(`⚠️ 경고: 스토리 씬이 참조하는 스토리 "${scene.storySlug}"를 찾을 수 없습니다. 건너뜁니다.`);
        return;
      }
      
      // 스토리 씬 생성 또는 업데이트
      await prisma.storyScene.upsert({
        where: {
          id: scene.id || -1,  // ID가 없으면 새로 생성되도록 존재하지 않는 ID 사용
        },
        update: {
          text: scene.text,
          sequence: scene.sequence,
        },
        create: {
          storyId: storyId,
          text: scene.text,
          sequence: scene.sequence,
        },
      });
    },
    '스토리 씬'
  );
}

// 브랜치 포인트(BranchPoint) 데이터 시드
export async function seedBranchPoints() {
  const branchPointSlugToId = new Map();
  
  // 스토리 ID 매핑 구축
  const allStories = await prisma.story.findMany();
  const storySlugToId = new Map();
  for (const story of allStories) {
    storySlugToId.set(story.slug, story.id);
  }
  
  // 브랜치 포인트 추가
  for (const branchPoint of branchPoints as unknown as BranchPoint[]) {
    // 연관된 스토리 ID 찾기
    const storyId = branchPoint.storySlug ? storySlugToId.get(branchPoint.storySlug) : 
                   (typeof branchPoint.storyId === 'string' ? storySlugToId.get(branchPoint.storyId) : branchPoint.storyId);
    
    if (!storyId) {
      console.warn(`⚠️ 경고: 브랜치 포인트 "${branchPoint.slug}"가 참조하는 스토리를 찾을 수 없습니다. 건너뜁니다.`);
      continue;
    }
    
    const status = branchPoint.status.toUpperCase() as BranchPointStatus;
    
    const id = await customUpsert(
      prisma.branchPoint,
      { slug: branchPoint.slug },
      {
        slug: branchPoint.slug,
        title: branchPoint.title,
        description: branchPoint.description,
        status: status,
        daoVoteId: branchPoint.daoVoteId,
        storyId: storyId,
      },
      '브랜치 포인트',
      branchPoint.slug
    );
    branchPointSlugToId.set(branchPoint.slug, id);
  }
  
  return branchPointSlugToId;
}

// 브랜치 포인트 씬(BranchPointScene) 데이터 시드
export async function seedBranchPointScenes() {
  // 브랜치 포인트 ID 매핑 구축
  const allBranchPoints = await prisma.branchPoint.findMany();
  const branchPointSlugToId = new Map();
  for (const bp of allBranchPoints) {
    branchPointSlugToId.set(bp.slug, bp.id);
  }
  
  // 브랜치 포인트 씬 추가 - 배치 처리 사용
  await processBatch(
    branchPointScenes as unknown as BranchPointScene[],
    async (scene) => {
      // 연관된 브랜치 포인트 ID 찾기
      const branchPointId = branchPointSlugToId.get(scene.branchPointSlug);
      
      if (!branchPointId) {
        console.warn(`⚠️ 경고: 브랜치 포인트 씬이 참조하는 브랜치 포인트 "${scene.branchPointSlug}"를 찾을 수 없습니다. 건너뜁니다.`);
        return;
      }
      
      // 브랜치 포인트 씬 생성 또는 업데이트
      await prisma.branchPointScene.upsert({
        where: {
          id: scene.id || -1,  // ID가 없으면 새로 생성되도록 존재하지 않는 ID 사용
        },
        update: {
          text: scene.text,
          order: scene.order,
        },
        create: {
          branchPointId: branchPointId,
          text: scene.text,
          order: scene.order,
        },
      });
    },
    '브랜치 포인트 씬'
  );
}

// DAO 선택지(DAOChoice) 데이터 시드
export async function seedDAOChoices() {
  const daoChoiceIdMap = new Map();
  
  // 브랜치 포인트 및 스토리 ID 매핑 구축
  const allBranchPoints = await prisma.branchPoint.findMany();
  const branchPointSlugToId = new Map();
  for (const bp of allBranchPoints) {
    branchPointSlugToId.set(bp.slug, bp.id);
  }
  
  const allStories = await prisma.story.findMany();
  const storySlugToId = new Map();
  for (const story of allStories) {
    storySlugToId.set(story.slug, story.id);
  }
  
  // DAO 선택지 추가
  for (const choice of daoChoices as unknown as DAOChoice[]) {
    // 연관된 브랜치 포인트 ID 찾기
    const branchPointId = choice.branchPointSlug ? branchPointSlugToId.get(choice.branchPointSlug) : choice.branchPointId;
    
    if (!branchPointId) {
      console.warn(`⚠️ 경고: DAO 선택지가 참조하는 브랜치 포인트를 찾을 수 없습니다. 건너뜁니다.`);
      continue;
    }
    
    // 다음 스토리 ID 찾기
    const nextStoryId = choice.nextStorySlug ? storySlugToId.get(choice.nextStorySlug) : choice.nextStoryId;
    
    if (!nextStoryId) {
      console.warn(`⚠️ 경고: DAO 선택지가 참조하는 다음 스토리를 찾을 수 없습니다. 건너뜁니다.`);
      continue;
    }
    
    const result = await prisma.dAOChoice.upsert({
      where: {
        id: choice.id || -1,  // ID가 없으면 새로 생성되도록 존재하지 않는 ID 사용
      },
      update: {
        text: choice.text,
        nextStoryId: nextStoryId,
        voteCount: choice.voteCount || 0,
      },
      create: {
        branchPointId: branchPointId,
        text: choice.text,
        nextStoryId: nextStoryId,
        voteCount: choice.voteCount || 0,
      },
    });
    
    if (choice.id) {
      daoChoiceIdMap.set(choice.id, result.id);
    }
  }
  
  return daoChoiceIdMap;
}

// 아이템(Item) 데이터 시드
export async function seedItems() {
  const itemCodeToId = new Map();
  
  // 아이템 추가 - 배치 처리 사용
  await processBatch(
    items as unknown as Item[],
    async (item) => {
      // 모든 필수 필드가 있는지 확인
      if (!item.code || !item.name || !item.description || !item.rarity || !item.itemType) {
        console.warn(`⚠️ 경고: 아이템에 필수 필드가 누락되었습니다: ${JSON.stringify(item)}`);
        return;
      }
      
      const itemRarity = item.rarity.toUpperCase() as ItemRarity;
      const itemType = item.itemType.toUpperCase() as ItemType;
      
      const id = await customUpsert(
        prisma.item,
        { code: item.code },
        {
          code: item.code,
          name: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
          rarity: itemRarity,
          itemType: itemType,
          useEffect: item.useEffect,
          statBonus: item.statBonus || {},
          isConsumable: !!item.isConsumable,
          isNFT: !!item.isNFT,
        },
        '아이템',
        item.code
      );
      itemCodeToId.set(item.code, id);
    },
    '아이템'
  );
  
  return itemCodeToId;
}

// 선택지 조건(ChoiceCondition) 데이터 시드
export async function seedChoiceConditions() {
  // 선택지 ID 매핑 구축
  const allChoices = await prisma.choice.findMany();
  const choiceSlugToId = new Map();
  for (const choice of allChoices) {
    choiceSlugToId.set(choice.slug, choice.id);
  }
  
  // 선택지 조건 추가 - 배치 처리 사용
  await processBatch(
    choiceConditions as unknown as ChoiceCondition[],
    async (condition) => {
      // 연관된 선택지 ID 찾기
      const choiceId = choiceSlugToId.get(condition.choiceSlug);
      
      if (!choiceId) {
        console.warn(`⚠️ 경고: 선택지 조건이 참조하는 선택지 "${condition.choiceSlug}"를 찾을 수 없습니다. 건너뜁니다.`);
        return;
      }
      
      // 선택지 조건 생성 또는 업데이트
      await prisma.choiceCondition.upsert({
        where: {
          id: condition.id || -1,  // ID가 없으면 새로 생성되도록 존재하지 않는 ID 사용
        },
        update: {
          classOnly: condition.classOnly,
          minHealth: condition.minHealth,
          minStrength: condition.minStrength,
          minAgility: condition.minAgility,
          minIntelligence: condition.minIntelligence,
          minWisdom: condition.minWisdom,
          minCharisma: condition.minCharisma,
          minHp: condition.minHp,
          minMp: condition.minMp,
        },
        create: {
          choiceId: choiceId,
          classOnly: condition.classOnly,
          minHealth: condition.minHealth,
          minStrength: condition.minStrength,
          minAgility: condition.minAgility,
          minIntelligence: condition.minIntelligence,
          minWisdom: condition.minWisdom,
          minCharisma: condition.minCharisma,
          minHp: condition.minHp,
          minMp: condition.minMp,
        },
      });
    },
    '선택지 조건'
  );
}

// 보상(Reward) 데이터 시드
export async function seedRewards() {
  // 선택지 및 아이템 ID 매핑 구축
  const allChoices = await prisma.choice.findMany();
  const choiceSlugToId = new Map();
  for (const choice of allChoices) {
    choiceSlugToId.set(choice.slug, choice.id);
  }
  
  const allItems = await prisma.item.findMany();
  const itemCodeToId = new Map();
  for (const item of allItems) {
    itemCodeToId.set(item.code, item.id);
  }
  
  // 보상 추가
  for (const reward of rewards as unknown as Reward[]) {
    // 필수 필드 확인
    if (!reward.nftTokenId) {
      console.warn(`⚠️ 경고: 보상에 nftTokenId가 누락되었습니다.`);
      continue;
    }
    
    // 연관된 선택지 ID 찾기 (있는 경우)
    let choiceId = null;
    if (reward.choiceSlug) {
      choiceId = choiceSlugToId.get(reward.choiceSlug);
    } else if (reward.choiceId) {
      choiceId = reward.choiceId;
    }
    
    // 연관된 아이템 ID 찾기 (있는 경우)
    let itemId = null;
    if (reward.itemCode) {
      itemId = itemCodeToId.get(reward.itemCode);
    } else if (reward.itemId) {
      itemId = reward.itemId;
    }
    
    // PlayerNFT 생성 또는 업데이트 - 스키마에 없는 필드 제거
    try {
      await prisma.playerNFT.upsert({
        where: {
          id: reward.id || -1,  // ID가 없으면 새로 생성되도록 존재하지 않는 ID 사용
        },
        update: {
          nftTokenId: reward.nftTokenId,
          choiceId: choiceId,
          itemId: itemId,
          createdAt: reward.createdAt ? new Date(reward.createdAt) : new Date(),
        },
        create: {
          nftTokenId: reward.nftTokenId,
          userId: reward.userId || 1, // 기본 사용자 ID 설정
          choiceId: choiceId,
          itemId: itemId,
          createdAt: reward.createdAt ? new Date(reward.createdAt) : new Date(),
        },
      });
    } catch (error) {
      console.error(`보상 추가 중 오류: ${error}`);
    }
  }
}

// 캐릭터 클래스 시딩 함수
export async function seedCharacterClasses() {
  const processClass = async (characterClass: CharacterClass) => {
    try {
      await customUpsert(
        prisma.characterClass,
        { code: characterClass.code },
        {
          code: characterClass.code,
          name: characterClass.name,
          description: characterClass.description,
          recommendedStat1: characterClass.recommendedStat1,
          recommendedStat2: characterClass.recommendedStat2,
        },
        'CharacterClass',
        characterClass.code
      );
    } catch (error) {
      console.error(`캐릭터 클래스 '${characterClass.name}' 생성 중 오류:`, error);
      throw error;
    }
  };

  await processBatch<CharacterClass>(
    characterClasses as CharacterClass[],
    processClass,
    'CharacterClass'
  );
}

// 기존 스크립트에서 직접 실행할 경우
if (require.main === module) {
  seedDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('시딩 실패:', error);
      process.exit(1);
    });
}
