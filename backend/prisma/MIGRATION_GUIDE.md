# Slug 필드 마이그레이션 가이드

이 가이드는 데이터베이스에 slug 필드를 추가하고 데이터를 마이그레이션하는 방법을 설명합니다.

## 변경사항 요약

다음 테이블에 `slug` 필드를 추가했습니다:

- `Story` - 스토리를 위한 URL 친화적인 식별자 (예: "isekai-summoning")
- `Quest` - 퀘스트를 위한 URL 친화적인 식별자 (예: "first-mission")
- `Choice` - 선택지를 위한 URL 친화적인 식별자 (예: "join-knights") 
- `BranchPoint` - 분기점을 위한 URL 친화적인 식별자 (예: "kingdom-destiny")

## 마이그레이션 단계

### 1. 스키마 마이그레이션 수행

Prisma 스키마가 이미 업데이트되었으므로, 이제 마이그레이션을 실행하세요:

```bash
cd backend
npx prisma migrate dev --name add_slugs
```

위 명령을 실행하면 다음이 수행됩니다:
- 새 마이그레이션 파일 생성
- 데이터베이스 스키마 업데이트
- Prisma 클라이언트 재생성

### 2. 데이터 시딩 실행

이제 업데이트된 시드 스크립트를 실행하여 모든 레코드에 slug 값을 추가하세요:

```bash
cd backend
npm run seed
```

시드 스크립트는 다음과 같이 동작합니다:
- 기존 JSON 파일에서 slug 값을 사용
- slug 값이 없는 경우 제목에서 자동 생성
- 관계가 있는 테이블의 경우 slug를 사용하여 관련 레코드를 찾음

### 3. API 구현 업데이트

이제 API 엔드포인트를 업데이트하여 slug로 리소스를 조회할 수 있습니다:

예시 API 변경:

```typescript
// ID로 조회하는 대신 slug로 조회
app.get('/api/stories/:slug', async (req, res) => {
  const story = await prisma.story.findUnique({
    where: { slug: req.params.slug },
    include: { quests: true }
  });
  
  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }
  
  return res.json(story);
});
```

또한 리소스 생성/업데이트 엔드포인트도 업데이트하여 slug 값을 처리해야 합니다.

## 주의사항

1. **slug는 고유해야 합니다**: 각 테이블에서 slug는 고유해야 하며, URL 친화적인 형식이어야 합니다.
2. **기존 데이터 참조**: 기존 애플리케이션이 ID로 데이터를 참조하는 경우, 두 방식을 모두 지원하거나 점진적으로 마이그레이션하는 전략을 고려하세요.
3. **프론트엔드 업데이트**: 프론트엔드 코드도 업데이트하여 slug 기반 URL을 사용하도록 하세요.

## 추가 팁

- SEO 관점에서 slug 필드는 웹사이트의 URL 구조를 개선합니다.
- 실제 운영 환경에서는 slug가 변경될 때 이전 slug에서 새 slug로 리디렉션을 구현하는 것이 좋습니다. 