export type SessionResult = {
  id: string;
  timestamp: number;
  durationMs: number;
  length: number;
  attempts: number;
  correct: number;
  errors: number;
  grossWPM: number;
  netWPM: number;
  accuracy: number; // 0..1
  topTrouble: { char: string; errorRate: number; attempts: number }[];
};

export type CharStats = Record<string, { attempts: number; errors: number }>;

