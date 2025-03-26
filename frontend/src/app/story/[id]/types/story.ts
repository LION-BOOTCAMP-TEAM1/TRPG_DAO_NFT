export interface Choice {
  id: number;
  slug: string;
  questId: number;
  text: string;
  nextStoryId: number | null;
}

export interface Quest {
  id: number;
  slug: string;
  storyId: number;
  title: string;
  description: string;
  choices: Choice[];
}

export interface BranchPoint {
  id: number;
  slug: string;
  storyId: number;
  title: string;
  description: string;
  status: string;
  daoVoteId: string;
  resultChoiceId: number | null;
}

export interface StoryScene {
  id: number;
  storyId: number;
  sequence: number;
  text: string;
  createdAt: string;
}

export interface Story {
  id: number;
  title: string;
  content: string;
  summary: string;
  createdAt: string;
  quests: Quest[];
  BranchPoint: BranchPoint[];
  StoryScene: StoryScene[];
}
