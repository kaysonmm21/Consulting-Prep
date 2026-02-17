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
  hypothesisAndPrioritization: number;
  depth: number;
  clarifyingQuestions: number;
  delivery: number;
}

export interface EvaluationFeedback {
  meceComment: string;
  caseFitComment: string;
  hypothesisAndPrioritizationComment: string;
  depthComment: string;
  clarifyingQuestionsComment: string;
  deliveryComment: string;
  suggestions: { title: string; detail: string }[];
  topStrength: string;
  topImprovement: string;
}
