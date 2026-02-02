export interface RoleAnalysis {
  demographics: {
    age: string;
    gender: string;
    location: string;
    income: string;
    education: string;
  };
  psychographics: {
    values: string[];
    interests: string[];
    lifestyle: string[];
    personality: string[];
  };
  painPoints: string[];
  goals: string[];
  contentPreferences: {
    platforms: string[];
    formats: string[];
    tone: string;
    topics: string[];
  };
  marketingInsights: {
    triggers: string[];
    objections: string[];
    solutions: string[];
  };
}

export interface ContentGenerationRequest {
  roleDescription: string;
  titleCount?: number;
  articleCount?: number;
  imageCount?: number;
}

export interface ContentGenerationResponse {
  roleId: string;
  analysis: RoleAnalysis;
  titles: string[];
  articles: Article[];
  images: ImageMetadata[];
  outputPath: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  platform: 'xiaohongshu' | 'weixin' | 'douyin';
  tags: string[];
  imagePrompts: string[];
}

export interface ImageMetadata {
  id: string;
  prompt: string;
  url?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
}

export interface GenerationProgress {
  step: string;
  progress: number;
  message: string;
  data?: any;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}