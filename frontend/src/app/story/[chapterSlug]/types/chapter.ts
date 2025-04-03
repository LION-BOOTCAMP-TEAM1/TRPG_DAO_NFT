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

export interface Session {
  id: number;
  name: string;
  createdAt: string;
  storyWorldId: number;
  users: User[];
  participants: Participant[];
}

export interface Participant {
  id: number;
  sessionId: number;
  userId: number;
  isReady: boolean;
  hasVoted: boolean;
  role: string | null;
  joinedAt: string;
  users: User;
}

export interface User {
  id: number;
  walletAddress: string;
  createdAt: string;
}
