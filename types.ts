
export enum GameStage {
  Intro,
  CaseLoading,
  CrimeScene, // Player views crime scene, initial clues, and is presented with the riddle
  RiddleActive, // Player is actively trying to solve the riddle
  Suspects, // Player reviews suspects
  Deduction, // Player makes a choice
  Resolution,
}

export interface Clue {
  id: string;
  description: string;
  type: 'physical' | 'testimonial' | 'circumstantial' | 'riddle_reward';
  details: string;
  isRevealed: boolean; // Initially true for some, riddle reward starts false
  isNewlyDiscovered?: boolean; // For animation purposes
}

export interface Suspect {
  id: string;
  name: string;
  background: string;
  motiveOrAlibi: string;
  imageUrl: string;
  interrogationNotes?: string; 
}

export interface Riddle {
  text: string;
  answer: string;
  relatedClueId: string; // Which clue this riddle unlocks or gives more info about
  isSolved: boolean;
}

export interface CaseData {
  victimName: string;
  causeOfDeath: string;
  locationDescription: string;
  crimeSceneImageUrl: string;
  caseSummary: string;
  clues: Clue[];
  suspects: Suspect[];
  culpritId: string;
  culpritReason: string;
  riddle: Riddle;
}

// For Gemini service response parsing
export interface GeminiCaseJSONStructure {
  victimName: string;
  causeOfDeath: string;
  locationDescription: string;
  crimeSceneImageUrlSeed: string;
  caseSummary: string;
  clues: Array<{ id: string; description: string; type: 'physical' | 'testimonial' | 'circumstantial'; details: string }>;
  suspects: Array<{ id: string; name: string; background: string; motiveOrAlibi: string; imageUrlSeed: string }>;
  culpritId: string;
  culpritReason: string;
  riddle: {
    text: string;
    answer: string;
    relatedClueId: string;
  };
}

export type Theme = 'light' | 'dark';
