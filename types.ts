export enum GenerationState {
  IDLE = 'IDLE',
  GENERATING_OUTLINE = 'GENERATING_OUTLINE',
  AWAITING_OUTLINE_APPROVAL = 'AWAITING_OUTLINE_APPROVAL',
  GENERATING_HOOK = 'GENERATING_HOOK',
  AWAITING_HOOK_SELECTION = 'AWAITING_HOOK_SELECTION',
  GENERATING_CHAPTERS = 'GENERATING_CHAPTERS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export enum ApiProvider {
    GEMINI = 'Gemini',
    GROQ = 'Groq',
}

export interface ChapterOutline {
  chapter: number;
  summary: string;
  wordCount: number;
}

export interface ScriptOutline {
  title: string;
  totalWordCount: number;
  chapters: ChapterOutline[];
  twist?: string;
}

export interface ChapterContent extends ChapterOutline {
  content: string;
}

export interface ScriptRecord {
    id: string;
    createdAt: string;
    title: string;
    plot: string;
    outline: ScriptOutline | null;
    hook: string;
    finalScript: ChapterContent[];
    status: GenerationState;
}

export interface AutomationJob {
    id: string;
    title: string;
    duration: number;
    plot: string;
}

export interface Style {
    id: string;
    name: string;
    styleJson: string; // The JSON string representing the style
}

export interface FavoriteTitle {
    id:string;
    title: string;
    createdAt: string;
}