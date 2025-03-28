import { PrismaClient, BranchPointStatus, ItemRarity, ItemType } from '@prisma/client';
import fs from 'fs';
import path from 'path';

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

const prisma = new PrismaClient();

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

// 추가: StoryWorld 타입 정의
type StoryWorld = {
  id?: number;
  slug: string;
  title: string;
  description: string;
  coverImage?: string;
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

async function main() {
  console.log('시작: 데이터베이스 시딩...');
  console.log(
    '⚠️ 주의: 이 스크립트는 slug 필드가 추가된 새 스키마를 사용합니다.'
  );
  console.log(
    '먼저 "npx prisma migrate dev --name add_slugs" 명령어로 마이그레이션을 실행하세요.'
  );

  try {
    // 트랜잭션 내에서 모든 작업 수행
    await prisma.$transaction(async (tx) => {
      // 0. 스토리 세계관(StoryWorld) 추가
      console.log('스토리 세계관 데이터 추가 중...');
      for (const storyWorld of storyWorlds as unknown as StoryWorld[]) {
        await tx.storyWorld.upsert({
          where: { 
            slug: storyWorld.slug
          },
          update: {
            title: storyWorld.title,
            description: storyWorld.description,
            coverImage: storyWorld.coverImage,
          },
          create: {
            slug: storyWorld.slug,
            title: storyWorld.title,
            description: storyWorld.description,
            coverImage: storyWorld.coverImage,
          },
        });
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

        // @ts-ignore - slug 필드가 추가된 새 스키마를 사용합니다
        await tx.story.upsert({
          where: { 
            slug: story.slug || slugify(story.title) 
          },
          update: {
            title: story.title,
            summary: story.summary,
            slug: story.slug || slugify(story.title),
            storyWorldId: storyWorldId,
            imageUrl: story.imageUrl,
          },
          create: {
            title: story.title,
            summary: story.summary,
            slug: story.slug || slugify(story.title),
            storyWorldId: storyWorldId,
            imageUrl: story.imageUrl,
          },
        });
      }

      // 스토리 슬러그 -> ID 매핑 구축
      const allStories = await tx.story.findMany();
      const storySlugToId = new Map();
      for (const story of allStories) {
        // @ts-ignore - slug 필드가 추가된 새 스키마를 사용합니다
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

        await tx.chapter.upsert({
          where: { 
            slug: chapter.slug 
          },
          update: {
            storyId: storyId,
            title: chapter.title,
            description: chapter.description,
            sequence: chapter.sequence,
            imageUrl: chapter.imageUrl,
          },
          create: {
            slug: chapter.slug,
            storyId: storyId,
            title: chapter.title,
            description: chapter.description,
            sequence: chapter.sequence,
            imageUrl: chapter.imageUrl,
          },
        });
      }

      // 챕터 슬러그 -> ID 매핑 구축
      const allChapters = await tx.chapter.findMany();
      const chapterSlugToId = new Map();
      for (const chapter of allChapters) {
        // @ts-ignore - slug 필드가 추가된 새 스키마를 사용합니다
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

        // @ts-ignore - slug 필드가 추가된 새 스키마를 사용합니다
        await tx.quest.upsert({
          where: { 
            slug: quest.slug 
          },
          update: {
            storyId: storyId,
            chapterId: chapterId, // 챕터 연결
            title: quest.title,
            description: quest.description,
          },
          create: {
            storyId: storyId,
            chapterId: chapterId, // 챕터 연결
            slug: quest.slug,
            title: quest.title,
            description: quest.description,
          },
        });
      }

      // 퀘스트 슬러그 -> ID 매핑 구축
      const allQuests = await tx.quest.findMany();
      const questSlugToId = new Map();
      for (const quest of allQuests) {
        // @ts-ignore - slug 필드가 추가된 새 스키마를 사용합니다
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

        // @ts-ignore - slug 필드가 추가된 새 스키마를 사용합니다
        await tx.choice.upsert({
          where: { slug: choice.slug || slugify(choice.text) },
          update: {
            questId,
            text: choice.text,
            nextStoryId,
            slug: choice.slug || slugify(choice.text),
          },
          create: {
            questId,
            text: choice.text,
            nextStoryId,
            slug: choice.slug || slugify(choice.text),
          },
        });
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

        await tx.storyScene.upsert({
          where: { id: scene.id || 0 },
          update: {
            storyId: storyId,
            sequence: scene.sequence,
            text: scene.text,
          },
          create: {
            storyId: storyId,
            sequence: scene.sequence,
            text: scene.text,
          },
        });
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

        await tx.branchPoint.upsert({
          where: { slug: bp.slug || slugify(bp.title) },
          update: {
            storyId: Number(storyId),
            title: bp.title,
            description: bp.description,
            status: status,
            daoVoteId: bp.daoVoteId,
            slug: bp.slug || slugify(bp.title),
          },
          create: {
            // id 필드 제거 - 자동 생성됨
            storyId: Number(storyId),
            title: bp.title,
            description: bp.description,
            status: status,
            daoVoteId: bp.daoVoteId,
            slug: bp.slug || slugify(bp.title),
          },
        });
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

        await tx.branchPointScene.upsert({
          where: { id: bpScene.id || 0 },
          update: {
            branchPointId: branchPointId,
            order: bpScene.order,
            text: bpScene.text,
          },
          create: {
            branchPointId: branchPointId,
            order: bpScene.order,
            text: bpScene.text,
          },
        });
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

        await tx.dAOChoice.upsert({
          where: { id: choice.id || 0 }, // DAOChoice에는 slug가 없어서 id로 검색
          update: {
            text: choice.text,
            nextStoryId,
            voteCount: choice.voteCount || 0,
            branchPoint: {
              connect: { id: branchPointId }
            }
          },
          create: {
            text: choice.text,
            nextStoryId,
            voteCount: choice.voteCount || 0,
            branchPoint: {
              connect: { id: branchPointId }
            }
          },
        });
      }

      // 아이템 데이터 추가
      console.log('아이템 데이터 추가 중...');
      for (const item of items as unknown as Item[]) {
        await tx.item.upsert({
          where: { 
            code: item.code 
          },
          update: {
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
          create: {
            code: item.code,
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
        });
      }
    });

    console.log('완료: 데이터베이스 시딩 성공!');
  } catch (error) {
    console.error('시딩 중 오류 발생:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
