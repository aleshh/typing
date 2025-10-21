export type AppConfig = {
  sprintLength: number; // characters
  lineWidth: number; // soft wrap for display
  weights: {
    letters: number;
    numbers: number;
    punctuation: number;
  };
  emphasizeTrouble: boolean; // use char stats to weight generation
};

export const defaultConfig: AppConfig = {
  sprintLength: 300,
  lineWidth: 80,
  weights: {
    letters: 0.3,
    numbers: 0.2,
    punctuation: 0.5,
  },
  emphasizeTrouble: true,
};
