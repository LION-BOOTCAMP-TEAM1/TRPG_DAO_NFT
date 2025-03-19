import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Import seed data
import stories from './stories.json';
import quests from './quests.json';
import choices from './choices.json';
import storyScenes from './storyScenes.json';
import branchPoints from './branchPoints.json';
import branchPointScenes from './branchPointScenes.json';
import storyProgress from './storyProgress.json';
import rewards from './rewards.json';

const prisma = new PrismaClient();

/**
 * 📝 중요: 이 스크립트를 실행하기 전에 반드시 아래 명령어로 마이그레이션을 먼저 실행하세요!
 * 
 * ```
 * npx prisma migrate dev --name add_slugs
 * ```
 */

// 문자열을 URL 친화적인 slug로 변환하는 함수
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '') // 특수문자 제거
    .replace(/ +/g, '-'); // 공백을 하이픈으로 변환
}

// 각 모델의 타입 정의
type Story = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  quests: string[];
  branchPoints: string[];
};

type Quest = {
  id: number;
  slug: string;
  storySlug: string;
  storyId?: number;
  title: string;
  description: string;
  choices: string[];
};

type Choice = {
  id: number;
  slug: string;
  questSlug: string;
  questId?: number;
  text: string;
  nextStorySlug: string;
  nextStoryId?: number;
};

type BranchPoint = {
  id: number;
  slug: string;
  storyId: number | string;
  title: string;
  description: string;
  status: string;
  daoVoteId?: string;
  choices?: { text: string; nextStorySlug: string }[];
};

async function main() {
  console.log('시작: 데이터베이스 시딩...');
  console.log('⚠️ 주의: 이 스크립트는 slug 필드가 추가된 새 스키마를 사용합니다.');
  console.log('먼저 "npx prisma migrate dev --name add_slugs" 명령어로 마이그레이션을 실행하세요.');

  try {
    // 트랜잭션 내에서 모든 작업 수행
    await prisma.$transaction(async (tx) => {
      // 1. 스토리 추가
      console.log('스토리 데이터 추가 중...');
      for (const story of stories as unknown as Story[]) {
        // @ts-ignore - slug 필드가 추가된 새 스키마를 사용합니다
        await tx.story.upsert({
          where: { id: story.id },
          update: {
            title: story.title,
            summary: story.summary,
            slug: story.slug || slugify(story.title),
          },
          create: {
            id: story.id,
            title: story.title,
            summary: story.summary,
            slug: story.slug || slugify(story.title),
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

      // 2. 퀘스트 추가
      console.log('퀘스트 데이터 추가 중...');
      for (const quest of quests as unknown as Quest[]) {
        const storyId = quest.storyId || 
                      (quest.storySlug ? storySlugToId.get(quest.storySlug) : null);
        
        if (!storyId) {
          console.warn(`스토리를 찾을 수 없음 (ID: ${quest.storyId || '없음'}, slug: ${quest.storySlug || '없음'}). 퀘스트 건너뜀: ${quest.id}`);
          continue;
        }

        // @ts-ignore - slug 필드가 추가된 새 스키마를 사용합니다
        await tx.quest.upsert({
          where: { id: quest.id },
          update: {
            storyId,
            title: quest.title,
            description: quest.description,
            slug: quest.slug || slugify(quest.title),
          },
          create: {
            id: quest.id,
            storyId,
            title: quest.title,
            description: quest.description,
            slug: quest.slug || slugify(quest.title),
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
        const questId = choice.questId || 
                      (choice.questSlug ? questSlugToId.get(choice.questSlug) : null);
        
        if (!questId) {
          console.warn(`퀘스트를 찾을 수 없음 (ID: ${choice.questId || '없음'}, slug: ${choice.questSlug || '없음'}). 선택지 건너뜀: ${choice.id}`);
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
          where: { id: choice.id },
          update: {
            questId,
            text: choice.text,
            nextStoryId,
            slug: choice.slug || slugify(choice.text),
          },
          create: {
            id: choice.id,
            questId,
            text: choice.text,
            nextStoryId,
            slug: choice.slug || slugify(choice.text),
          },
        });
      }

      // 4. 스토리 장면 추가
      console.log('스토리 장면 데이터 추가 중...');
      for (const scene of storyScenes) {
        await tx.storyScene.upsert({
          where: { id: scene.id },
          update: {
            storyId: scene.storyId,
            order: scene.order,
            text: scene.text,
          },
          create: {
            id: scene.id,
            storyId: scene.storyId,
            order: scene.order,
            text: scene.text,
          },
        });
      }

      // 5. 분기점 추가
      console.log('분기점 데이터 추가 중...');
      for (const bp of branchPoints as unknown as BranchPoint[]) {
        let storyId = bp.storyId;
        
        // storyId가 문자열이면(slug) 실제 ID로 변환
        if (typeof bp.storyId === 'string' && bp.storyId !== String(parseInt(bp.storyId, 10))) {
          storyId = storySlugToId.get(bp.storyId) || null;
          
          if (!storyId) {
            console.warn(`스토리를 찾을 수 없음 (slug: ${bp.storyId}). 분기점 건너뜀: ${bp.id}`);
            continue;
          }
        }

        // @ts-ignore - slug 필드가 추가된 새 스키마를 사용합니다
        await tx.branchPoint.upsert({
          where: { id: bp.id },
          update: {
            storyId: Number(storyId),
            title: bp.title,
            description: bp.description,
            status: bp.status || 'open',
            daoVoteId: bp.daoVoteId,
            slug: bp.slug || slugify(bp.title),
          },
          create: {
            id: bp.id,
            storyId: Number(storyId),
            title: bp.title,
            description: bp.description,
            status: bp.status || 'open',
            daoVoteId: bp.daoVoteId,
            slug: bp.slug || slugify(bp.title),
          },
        });
      }

      // 6. 분기점 장면 추가
      console.log('분기점 장면 데이터 추가 중...');
      for (const bpScene of branchPointScenes) {
        await tx.branchPointScene.upsert({
          where: { id: bpScene.id },
          update: {
            branchPointId: bpScene.branchPointId,
            order: bpScene.order,
            text: bpScene.text,
          },
          create: {
            id: bpScene.id,
            branchPointId: bpScene.branchPointId,
            order: bpScene.order,
            text: bpScene.text,
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
