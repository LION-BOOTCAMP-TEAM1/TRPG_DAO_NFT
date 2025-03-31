import { PrismaClient, BranchPointStatus, ItemRarity, ItemType } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

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

const prisma = new PrismaClient();

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
  console.log('==================================================');
  console.log('시작: 데이터베이스 시딩...');
  console.log(`중복 데이터 처리 모드: ${OVERWRITE_DUPLICATES ? '덮어쓰기' : '건너뛰기'}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || '(설정되지 않음)'}`);
  console.log('==================================================');
  
  // 카운터 초기화
  duplicatesFound = 0;
  newItemsCreated = 0;
  updatedItems = 0;
  skippedItems = 0;

  try {
    // Prisma 클라이언트 타임아웃 설정 (증가)
    // Node.js에서 기본 HTTP 요청 타임아웃 증가 (5분으로 설정)
    const http = require('http');
    const https = require('https');
    http.globalAgent.keepAlive = true;
    https.globalAgent.keepAlive = true;
    
    http.globalAgent.options.timeout = 300000; // 5분
    https.globalAgent.options.timeout = 300000; // 5분

    // 연결 테스트
    console.log('데이터베이스 연결 테스트 중...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('데이터베이스 연결 성공!');
    
    // 트랜잭션 옵션 설정: 타임아웃 증가
    const MAX_TIMEOUT = 300; // 초 단위 (5분)
    const txOptions = {
      maxWait: MAX_TIMEOUT * 1000, // 밀리초 단위
      timeout: MAX_TIMEOUT * 1000   // 밀리초 단위
    };
    
    console.log(`트랜잭션 타임아웃 설정: ${MAX_TIMEOUT}초`);
    
    // 각 엔티티를 별도의 트랜잭션에서 처리하므로 개별 실패해도 다른 작업은 진행됨
    
    // 1. 장르 데이터 추가
    console.log('장르 데이터 추가 중...');
    await seedGenres();
    
    // 처리 사이에 약간의 지연 추가
    await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    
    // 2. 스토리 세계관 데이터 추가
    console.log('스토리 세계관 데이터 추가 중...');
    await seedStoryWorlds();
    
    // 처리 사이에 약간의 지연 추가
    await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    
    // 3. 스토리 데이터 추가
    console.log('스토리 데이터 추가 중...');
    try {
      // 스토리 데이터 추가
      const storySlugToId = new Map();
      
      // 스토리 세계관 ID 매핑 구축
      const allStoryWorlds = await prisma.storyWorld.findMany();
      const storyWorldSlugToId = new Map();
      for (const storyWorld of allStoryWorlds) {
        storyWorldSlugToId.set(storyWorld.slug, storyWorld.id);
      }
      
      // 스토리 추가 - 배치 처리 사용
      await processBatch(
        stories as unknown as Story[],
        async (story) => {
          const id = await customUpsert(
            prisma.story,
            { slug: story.slug },
            {
              slug: story.slug,
              title: story.title,
              summary: story.summary,
              imageUrl: story.imageUrl,
              storyWorldId: storyWorldSlugToId.get(story.slug.split('-')[0]), // 스토리 슬러그의 첫 부분을 세계관 슬러그로 간주
            },
            '스토리',
            story.slug
          );
          storySlugToId.set(story.slug, id);
        },
        '스토리'
      );
    } catch (error) {
      console.error('스토리 데이터 추가 중 오류:', error);
      // 오류가 발생해도 계속 진행
    }
    
    // 4. 챕터 데이터 추가
    console.log('챕터 데이터 추가 중...');
    try {
      // 챕터 데이터 추가 로직
      // ... 이하 챕터 추가 코드 ...
    } catch (error) {
      console.error('챕터 데이터 추가 중 오류:', error);
    }
    
    // 5. 퀘스트 데이터 추가
    console.log('퀘스트 데이터 추가 중...');
    try {
      // 퀘스트 데이터 추가 로직
      // ... 이하 퀘스트 추가 코드 ...
    } catch (error) {
      console.error('퀘스트 데이터 추가 중 오류:', error);
    }
    
    // 이하 다른 시드 함수들도 비슷한 방식으로 수정

    console.log('완료: 데이터베이스 시딩 성공!');
    console.log(`통계: ${newItemsCreated}개 새로 생성, ${updatedItems}개 업데이트, ${skippedItems}개 건너뜀, 총 ${duplicatesFound}개 중복 발견`);
  } catch (error) {
    console.error('시딩 중 오류 발생:', error);
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

// 나머지 엔티티별 시드 함수들도 비슷한 형태로 구현...
// ... existing code ...

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
