export interface CasePrompt {
  id: string;
  title: string;
  category: 'profitability' | 'market-entry' | 'ma' | 'pricing' | 'operations';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prompt: string;
  clarifyingQuestions: { question: string; answer: string }[];
  exampleFramework: {
    buckets: { name: string; subPoints: string[] }[];
    explanation: string;
  };
}

export interface SessionResult {
  id: string;
  caseId: string;
  date: string;
  transcript: string;
  frameworkTime: number;
  presentationTime: number;
  scores: EvaluationScores;
  feedback: EvaluationFeedback;
  showedTranscript: boolean;
}

export interface EvaluationScores {
  overall: number;
  mece: number;
  caseFit: number;
  prioritization: number;
  depth: number;
  hypothesis: number;
  clarifyingQuestions: number;
  delivery: number;
  fillerWords: number;
}

export interface EvaluationFeedback {
  summary: string;
  meceComment: string;
  caseFitComment: string;
  prioritizationComment: string;
  depthComment: string;
  hypothesisComment: string;
  clarifyingQuestionsComment: string;
  deliveryComment: string;
  fillerWordsComment: string;
  fillerWordCount: number;
  fillerWordList: string[];
  suggestedFramework: {
    buckets: { name: string; subPoints: string[] }[];
    explanation: string;
  };
  topStrength: string;
  topImprovement: string;
}
