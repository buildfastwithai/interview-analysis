// Types matching the FastAPI Pydantic models
export type AIProvider = "openai" | "gemini";

export type SkillLevel = 
  | "Beginner"
  | "Intermediate" 
  | "Advanced"
  | "Expert"
  | "Not Demonstrated";

export type GradeLevel =
  | "Excellent"
  | "Good" 
  | "Average"
  | "Below Average"
  | "Poor";

export interface SkillAssessment {
  skill: string;
  level: SkillLevel;
  confidence_score: number; // 0-100
  evidence: string;
  recommendations: string;
}

export interface QuestionAnswer {
  question: string;
  answer: string;
  grade: GradeLevel;
  score: number; // 0-100
  feedback: string;
  key_points_covered: string[];
  areas_for_improvement: string[];
}

export interface InterviewInsights {
  overall_performance_score: number; // 0-100
  communication_clarity: number; // 0-100
  technical_depth: number; // 0-100
  problem_solving_ability: number; // 0-100
  confidence_level: number; // 0-100
  
  strengths: string[];
  weaknesses: string[];
  key_achievements_mentioned: string[];
  red_flags: string[];
  
  interview_duration_analysis: string;
  speech_patterns: string;
  engagement_level: string;
  cultural_fit_indicators: string[];
  
  hiring_recommendation: string;
  next_steps: string[];
}

// Request types
export interface TranscriptRequest {
  video_url: string;
  ai_provider: AIProvider;
  format_prompt?: string;
}

export interface InterviewAnalysisRequest {
  skills_to_assess: string[];
  job_role?: string;
  company_name?: string;
  ai_provider: AIProvider;
}

// Response types
export interface TranscriptResponse {
  video_id?: string;
  filename?: string;
  raw_transcript: string;
  formatted_response: string;
  ai_provider: string;
  file_chunks?: number;
}

export interface ComprehensiveAnalysisResponse {
  video_id?: string;
  filename?: string;
  raw_transcript: string;
  formatted_transcript: string;
  ai_provider: string;
  file_chunks?: number;
  
  // Enhanced analysis
  skill_assessments: SkillAssessment[];
  questions_and_answers: QuestionAnswer[];
  interview_insights: InterviewInsights;
  analysis_summary: string;
}

export interface HealthResponse {
  status: string;
  message: string;
}

// Error response type
export interface APIError {
  detail: string;
}

// File validation types
export interface FileValidation {
  isValid: boolean;
  error?: string;
  fileSize?: number;
  fileType?: string;
}

// Audio processing types
export interface AudioChunk {
  path: string;
  index: number;
  duration?: number;
}

export interface TranscriptQuality {
  isValid: boolean;
  message: string;
  errorCount?: number;
  hasQuestions?: boolean;
} 