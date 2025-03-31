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
    // 연결 테스트
    console.log('데이터베이스 연결 테스트 중...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('데이터베이스 연결 성공!');
    
    // 트랜잭션 내에서 모든 작업 수행
    await prisma.$transaction(async (tx) => {
      // 장르 데이터 추가
      console.log('장르 데이터 추가 중...');
      for (const genre of genres as unknown as Genre[]) {
        await customUpsert(
          tx.genre,
          { code: genre.code },
          {
            code: genre.code,
            name: genre.name,
            description: genre.description,
          },
          '장르',
          genre.code
        );
      }
      
      // 장르 코드 -> ID 매핑 구축
      const allGenres = await tx.genre.findMany();
      const genreCodeToId = new Map();
      for (const genre of allGenres) {
        genreCodeToId.set(genre.code, genre.id);
      }

      // 0. 스토리 세계관(StoryWorld) 추가
      console.log('스토리 세계관 데이터 추가 중...');
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

        await customUpsert(
          tx.storyWorld,
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
      }

      // 스토리월드 슬러그 -> ID 매핑 구축
      const allStoryWorlds = await tx.storyWorld.findMany();
      const storyWorldSlugToId = new Map();
      for (const storyWorld of allStoryWorlds) {
        storyWorldSlugToId.set(storyWorld.slug, storyWorld.id);
      }

      // 1. 스토리 추가 (스토리월드 연결)
      console.log('스토리 데이터 추가 중...');
      for (const story of stories as unknown as Story[]) {
        // 이세계 관련 스토리는 fantasy-isekai 세계관으로 설정
        let storyWorldId = null;
        if (story.slug.includes('isekai')) {
          storyWorldId = storyWorldSlugToId.get('fantasy-isekai');
        } 
        // 왕국 관련 스토리는 medieval-kingdom 세계관으로 설정
        else if (story.slug.includes('royal') || story.slug.includes('kingdom')) {
          storyWorldId = storyWorldSlugToId.get('medieval-kingdom');
        }
        // 어둡거나 야생 관련 스토리는 dark-fantasy 세계관으로 설정
        else if (story.slug.includes('dark') || story.slug.includes('wild')) {
          storyWorldId = storyWorldSlugToId.get('dark-fantasy');
        }

        const slug = story.slug || slugify(story.title);
        await customUpsert(
          tx.story,
          { slug },
          {
            title: story.title,
            summary: story.summary,
            slug,
            storyWorldId: storyWorldId,
            imageUrl: story.imageUrl,
          },
          '스토리',
          slug
        );
      }

      // 스토리 슬러그 -> ID 매핑 구축
      const allStories = await tx.story.findMany();
      const storySlugToId = new Map();
      for (const story of allStories) {
        storySlugToId.set(story.slug, story.id);
      }

      // 1.5 챕터 추가
      console.log('챕터 데이터 추가 중...');
      for (const chapter of chapters as unknown as Chapter[]) {
        let storyId = chapter.storyId;
        
        // 단일 storySlug가 있는 경우
        if (!storyId && chapter.storySlug) {
          storyId = storySlugToId.get(chapter.storySlug);
        }
        
        // storySlugs 배열이 있는 경우 첫 번째 항목 사용
        if (!storyId && chapter.storySlugs && chapter.storySlugs.length > 0) {
          storyId = storySlugToId.get(chapter.storySlugs[0]);
        }

        if (!storyId) {
          console.warn(
            `스토리를 찾을 수 없음 (ID: ${chapter.storyId || '없음'}, slug: ${chapter.storySlug || '없음'}, storySlugs: ${chapter.storySlugs ? chapter.storySlugs.join(', ') : '없음'}). 챕터 건너뜀: ${chapter.slug}`
          );
          continue;
        }

        await customUpsert(
          tx.chapter,
          { slug: chapter.slug },
          {
            slug: chapter.slug,
            storyId: storyId,
            title: chapter.title,
            description: chapter.description,
            sequence: chapter.sequence,
            imageUrl: chapter.imageUrl,
          },
          '챕터',
          chapter.slug
        );
      }

      // 챕터 슬러그 -> ID 매핑 구축
      const allChapters = await tx.chapter.findMany();
      const chapterSlugToId = new Map();
      for (const chapter of allChapters) {
        chapterSlugToId.set(chapter.slug, chapter.id);
      }

      // 2. 퀘스트 추가 (챕터 연결 추가)
      console.log('퀘스트 데이터 추가 중...');
      for (const quest of quests as unknown as Quest[]) {
        const storyId =
          quest.storyId ||
          (quest.storySlug ? storySlugToId.get(quest.storySlug) : null);

        if (!storyId) {
          console.warn(
            `스토리를 찾을 수 없음 (ID: ${quest.storyId || '없음'}, slug: ${quest.storySlug || '없음'}). 퀘스트 건너뜀: ${quest.slug}`
          );
          continue;
        }

        // 퀘스트가 속한 챕터 찾기
        let chapterId = null;
        for (const chapter of chapters as unknown as Chapter[]) {
          if (chapter.questSlugs && chapter.questSlugs.includes(quest.slug)) {
            chapterId = chapterSlugToId.get(chapter.slug);
            break;
          }
        }

        // slug 필드가 있는지 확인하고, 없으면 title로부터 생성
        const questSlug = quest.slug || slugify(quest.title);
        
        // 로그 출력하여 디버깅에 도움이 되도록 함
        console.log(`퀘스트 추가: ${quest.title}, slug: ${questSlug}`);

        await customUpsert(
          tx.quest,
          { slug: questSlug },
          {
            slug: questSlug,  // 명시적으로 slug 필드를 데이터에 포함
            storyId: storyId,
            chapterId: chapterId, // 챕터 연결
            title: quest.title,
            description: quest.description,
          },
          '퀘스트',
          questSlug
        );
      }

      // 퀘스트 슬러그 -> ID 매핑 구축
      const allQuests = await tx.quest.findMany();
      const questSlugToId = new Map();
      for (const quest of allQuests) {
        questSlugToId.set(quest.slug, quest.id);
      }

      // 3. 선택지 추가
      console.log('선택지 데이터 추가 중...');
      for (const choice of choices as unknown as Choice[]) {
        const questId =
          choice.questId ||
          (choice.questSlug ? questSlugToId.get(choice.questSlug) : null);

        if (!questId) {
          console.warn(
            `퀘스트를 찾을 수 없음 (ID: ${choice.questId || '없음'}, slug: ${choice.questSlug || '없음'}). 선택지 건너뜀: ${choice.slug || choice.text.substring(0, 20)}`
          );
          continue;
        }

        let nextStoryId = null;
        if (choice.nextStoryId) {
          nextStoryId = choice.nextStoryId;
        } else if (choice.nextStorySlug) {
          nextStoryId = storySlugToId.get(choice.nextStorySlug) || null;
        }

        // 선택지 slug 생성 확인
        const choiceSlug = choice.slug || slugify(choice.text);
        
        // 로그 출력
        console.log(`선택지 추가: ${choice.text.substring(0, 30)}..., slug: ${choiceSlug}`);

        await customUpsert(
          tx.choice,
          { slug: choiceSlug },
          {
            slug: choiceSlug,  // 명시적으로 slug 필드 포함
            questId,
            text: choice.text,
            nextStoryId,
          },
          '선택지',
          choice.slug || choice.text.substring(0, 20)
        );
      }

      // 선택지 슬러그 -> ID 매핑 구축
      const allChoices = await tx.choice.findMany();
      const choiceSlugToId = new Map();
      for (const choice of allChoices) {
        choiceSlugToId.set(choice.slug, choice.id);
      }

      // 4. 스토리 장면 추가
      console.log('스토리 장면 데이터 추가 중...');
      for (const scene of storyScenes as unknown as StoryScene[]) {
        const storyId = storySlugToId.get(scene.storySlug);

        if (!storyId) {
          console.warn(
            `스토리를 찾을 수 없음 (slug: ${scene.storySlug}). 장면 건너뜀: ${scene.sequence}`
          );
          continue;
        }

        await customUpsert(
          tx.storyScene,
          { id: scene.id || 0 },
          {
            storyId: storyId,
            sequence: scene.sequence,
            text: scene.text,
          },
          '스토리 장면',
          scene.storySlug
        );
      }

      // 5. 분기점 추가
      console.log('분기점 데이터 추가 중...');
      for (const bp of branchPoints as unknown as BranchPoint[]) {
        // storyId 또는 storySlug로부터 실제 storyId 찾기
        let storyId = bp.storyId;
        
        if (!storyId && bp.storySlug) {
          storyId = storySlugToId.get(bp.storySlug);
        } else if (
          typeof bp.storyId === 'string' &&
          bp.storyId !== String(parseInt(bp.storyId as string, 10))
        ) {
          storyId = storySlugToId.get(bp.storyId as string) || null;
        }

        if (!storyId) {
          console.warn(
            `스토리를 찾을 수 없음 (slug: ${bp.storySlug || bp.storyId}). 분기점 건너뜀: ${bp.slug || bp.title}`
          );
          continue;
        }

        // Use the enum for status
        const status =
          bp.status === 'open'
            ? BranchPointStatus.OPEN
            : BranchPointStatus.CLOSED;

        // 분기점 slug 설정
        const bpSlug = bp.slug || slugify(bp.title);
        
        // 로그 출력
        console.log(`분기점 추가: ${bp.title}, slug: ${bpSlug}`);

        await customUpsert(
          tx.branchPoint,
          { slug: bpSlug },
          {
            slug: bpSlug,  // 명시적으로 slug 필드 포함
            storyId: Number(storyId),
            title: bp.title,
            description: bp.description,
            status: status,
            daoVoteId: bp.daoVoteId,
          },
          '분기점',
          bp.slug || bp.title
        );
      }

      // 분기점 슬러그 -> ID 매핑 구축
      const allBranchPoints = await tx.branchPoint.findMany();
      const branchPointSlugToId = new Map();
      for (const bp of allBranchPoints) {
        branchPointSlugToId.set(bp.slug, bp.id);
      }

      // 6. 분기점 장면 추가
      console.log('분기점 장면 데이터 추가 중...');
      for (const bpScene of branchPointScenes as unknown as BranchPointScene[]) {
        const branchPointId = branchPointSlugToId.get(bpScene.branchPointSlug);

        if (!branchPointId) {
          console.warn(
            `분기점을 찾을 수 없음 (slug: ${bpScene.branchPointSlug}). 장면 건너뜀: ${bpScene.order}`
          );
          continue;
        }

        await customUpsert(
          tx.branchPointScene,
          { id: bpScene.id || 0 },
          {
            branchPointId: branchPointId,
            order: bpScene.order,
            text: bpScene.text,
          },
          '분기점 장면',
          bpScene.branchPointSlug
        );
      }

      // 7. DAO 선택지 추가
      console.log('DAO 선택지 데이터 추가 중...');
      
      // 첫 번째 스토리 ID 가져오기 (기본값으로 사용)
      const defaultStoryId = storySlugToId.get(stories[0].slug) || 1;
      
      for (const choice of daoChoices as unknown as DAOChoice[]) {
        const branchPointId =
          choice.branchPointId ||
          (choice.branchPointSlug
            ? branchPointSlugToId.get(choice.branchPointSlug)
            : null);

        if (!branchPointId) {
          console.warn(
            `분기점을 찾을 수 없음 (ID: ${choice.branchPointId || '없음'}, slug: ${choice.branchPointSlug || '없음'}). DAO 선택지 건너뜀: ${choice.id || choice.text.substring(0, 20)}`
          );
          continue;
        }

        let nextStoryId = null;
        if (typeof choice.nextStoryId === 'number') {
          nextStoryId = choice.nextStoryId;
        } else if (choice.nextStorySlug) {
          nextStoryId = storySlugToId.get(choice.nextStorySlug) || null;
        } else if (typeof choice.nextStoryId === 'string' && !isNaN(parseInt(choice.nextStoryId))) {
          // 문자열 형태의 숫자인 경우
          nextStoryId = parseInt(choice.nextStoryId);
        } else if (typeof choice.nextStoryId === 'string') {
          // 문자열이 슬러그인 경우
          nextStoryId = storySlugToId.get(choice.nextStoryId) || null;
        }
        
        // nextStoryId가 없으면 기본값 사용
        if (nextStoryId === null) {
          console.warn(`다음 스토리를 찾을 수 없음 (slug: ${choice.nextStorySlug || choice.nextStoryId || '없음'}). 기본값 사용: ${defaultStoryId}`);
          nextStoryId = defaultStoryId;
        }

        await customUpsert(
          tx.dAOChoice,
          { id: choice.id || 0 }, // DAOChoice에는 slug가 없어서 id로 검색
          {
            text: choice.text,
            nextStoryId,
            voteCount: choice.voteCount || 0,
            branchPoint: {
              connect: { id: branchPointId }
            }
          },
          'DAO 선택지',
          choice.id || choice.text.substring(0, 20)
        );
      }

      // 아이템 데이터 추가
      console.log('아이템 데이터 추가 중...');
      for (const item of items as unknown as Item[]) {
        await customUpsert(
          tx.item,
          { code: item.code },
          {
            name: item.name,
            description: item.description,
            imageUrl: item.imageUrl,
            rarity: item.rarity as ItemRarity,
            itemType: item.itemType as ItemType,
            useEffect: item.useEffect,
            statBonus: item.statBonus as any,
            isConsumable: item.isConsumable,
            isNFT: item.isNFT || false,
          },
          '아이템',
          item.code
        );
      }

      // Reward (PlayerNFT) 데이터 추가
      console.log('보상 (PlayerNFT) 데이터 추가 중...');
      
      // 유저 데이터가 있는지 확인
      const usersCount = await tx.user.count();
      if (usersCount === 0) {
        console.warn('사용자 데이터가 없어 PlayerNFT 시딩을 건너뜁니다. 사용자 계정을 먼저 생성하세요.');
      } else {
        // 아이템 코드 -> ID 매핑 구축
        const allItems = await tx.item.findMany();
        const itemCodeToId = new Map();
        for (const item of allItems) {
          itemCodeToId.set(item.code, item.id);
        }
        
        // allChoices와 choiceSlugToId는 이미 위에서 정의됨
        
        for (const reward of rewards as unknown as Reward[]) {
          // userId가 유효한지 확인
          let userId = reward.userId || reward.ownerId;
          if (!userId) {
            console.warn(`사용자 ID가 없어 보상 건너뜀: ${reward.nftTokenId || reward.name}`);
            continue;
          }
          
          // 해당 유저가 있는지 확인
          const userExists = await tx.user.findUnique({
            where: { id: userId }
          });
          
          if (!userExists) {
            console.warn(`사용자를 찾을 수 없음 (ID: ${userId}). 보상 건너뜀: ${reward.nftTokenId || reward.name}`);
            continue;
          }
          
          // choiceId 결정
          let choiceId = reward.choiceId;
          if (!choiceId && reward.choiceSlug) {
            choiceId = choiceSlugToId.get(reward.choiceSlug);
          }
          
          // itemId 결정
          let itemId = reward.itemId;
          if (!itemId && reward.itemCode) {
            itemId = itemCodeToId.get(reward.itemCode);
          }
          
          try {
            await customUpsert(
              tx.playerNFT,
              { nftTokenId: reward.nftTokenId || `dummy-token-${reward.id || Date.now()}` },
              {
                userId: userId,
                choiceId: choiceId,
                itemId: itemId,
              },
              '보상 (PlayerNFT)',
              reward.nftTokenId || `dummy-token-${reward.id || Date.now()}`
            );
          } catch (error) {
            console.error(`보상 데이터 추가 중 오류 발생: ${error}`);
          }
        }
      }

      // 선택지 조건 데이터 추가
      console.log('선택지 조건 데이터 추가 중...');
      
      for (const condition of choiceConditions as unknown as ChoiceCondition[]) {
        const choiceId = choiceSlugToId.get(condition.choiceSlug);
        
        if (!choiceId) {
          console.warn(
            `선택지를 찾을 수 없음 (slug: ${condition.choiceSlug}). 선택지 조건 건너뜀`
          );
          continue;
        }
        
        // classExclude 필드는 현재 스키마에 없으므로 로그 출력
        if (condition.classExclude && condition.classExclude.length > 0) {
          console.warn(
            `선택지 (${condition.choiceSlug})에 classExclude 필드가 있지만 스키마에 정의되어 있지 않습니다. 이 정보는 저장되지 않습니다: [${condition.classExclude.join(', ')}]`
          );
        }
        
        await customUpsert(
          tx.choiceCondition,
          { id: condition.id || 0 },
          {
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
          '선택지 조건',
          condition.id || 0
        );
      }

      // StoryProgress 데이터 추가
      console.log('스토리 진행 데이터 추가 중...');
      
      // 유저 데이터가 있는지 확인
      if (usersCount === 0) {
        console.warn('사용자 데이터가 없어 StoryProgress 시딩을 건너뜁니다. 사용자 계정을 먼저 생성하세요.');
      } else {
        for (const progress of storyProgress as unknown as StoryProgressData[]) {
          // userId가 유효한지 확인
          const userId = progress.userId;
          if (!userId) {
            console.warn(`사용자 ID가 없어 스토리 진행 건너뜀: ${progress.id}`);
            continue;
          }
          
          // 해당 유저가 있는지 확인
          const userExists = await tx.user.findUnique({
            where: { id: userId }
          });
          
          if (!userExists) {
            console.warn(`사용자를 찾을 수 없음 (ID: ${userId}). 스토리 진행 건너뜀: ${progress.id}`);
            continue;
          }
          
          // storyId 결정
          let storyId = progress.storyId;
          if (!storyId && progress.storySlug) {
            storyId = storySlugToId.get(progress.storySlug);
          }
          
          if (!storyId) {
            console.warn(`스토리를 찾을 수 없음. 스토리 진행 건너뜀: ${progress.id}`);
            continue;
          }
          
          // questId 결정
          let currentQuestId = progress.currentQuestId;
          if (!currentQuestId && progress.currentQuestSlug) {
            currentQuestId = questSlugToId.get(progress.currentQuestSlug);
          }
          
          // chapterId 결정
          let currentChapterId = progress.currentChapterId;
          if (!currentChapterId && progress.currentChapterSlug) {
            currentChapterId = chapterSlugToId.get(progress.currentChapterSlug);
          }
          
          try {
            await customUpsert(
              tx.storyProgress,
              { id: progress.id || 0 },
              {
                userId: userId,
                storyId: storyId,
                currentQuestId: currentQuestId,
                currentChapterId: currentChapterId,
                completed: progress.completed,
                lastUpdated: progress.lastUpdated ? new Date(progress.lastUpdated) : new Date(),
              },
              '스토리 진행',
              progress.id || 0
            );
          } catch (error) {
            console.error(`스토리 진행 데이터 추가 중 오류 발생: ${error}`);
          }
        }
      }
    });

    console.log('완료: 데이터베이스 시딩 성공!');
    console.log(`통계: ${newItemsCreated}개 새로 생성, ${updatedItems}개 업데이트, ${skippedItems}개 건너뜀, 총 ${duplicatesFound}개 중복 발견`);
  } catch (error) {
    console.error('시딩 중 오류 발생:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
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
