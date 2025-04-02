export interface Chapter {
  id: number;
  slug: string;
  storyId: number;
  title: string;
  description: string;
  sequence: number;
  imageUrl: string;
  createdAt: string;
  story: {
    title: string;
    slug: string;
  };
}

export interface dummyChapter {
  id: number;
  worldId: number;
  genreId: number;
  slug: string;
  storySlug: string;
}

export type ChapterListResponse = Chapter[];
