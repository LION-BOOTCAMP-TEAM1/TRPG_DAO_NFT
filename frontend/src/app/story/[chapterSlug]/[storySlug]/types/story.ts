export interface Story {
  id: number;
  title: string;
  content: string;
  summary: string;
  imageUrl: string;
  createdAt: string;
  quests: Quest[];
  BranchPoint: BranchPoint[];
  StoryScene: StoryScene[];
}

export interface StoryScene {
  id: number;
  storyId: number;
  sequence: number;
  text: string;
  createdAt: string;
}

export interface Quest {
  id: number;
  slug: string;
  storyId: number;
  chapterId: number;
  title: string;
  description: string;
  choices: Choice[];
}

export interface Choice {
  id: number;
  slug: string;
  questId: number;
  text: string;
  nextStoryId: number | null;
  nextStorySlug: string | null;
  ChoiceCondition: ChoiceCondition[];
}

export interface ChoiceCondition {
  id: number;
  choiceId: number;
  type: string;
  value: string;
}

export interface BranchPoint {
  id: number;
  slug: string;
  storyId: number;
  title: string;
  description: string;
  status: 'OPEN' | 'CLOSED';
  daoVoteId: string;
  resultChoiceId: number | null;
  BranchPointScene: BranchPointScene[];
  DAOChoice: DAOChoice[];
}

export interface BranchPointScene {
  id: number;
  branchPointId: number;
  order: number;
  text: string;
}

export interface DAOChoice {
  id: number;
  branchPointId: number;
  text: string;
  nextStoryId: number;
  nextStorySlug: string;
  voteCount: number;
  createdAt: string;
}

export interface dummyBranch {
  description: string;
  sessionId: number;
  scope: number;
  duration: number;
  numOptions: number;
}
