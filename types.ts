export interface UserProfile {
  name: string;
  callName: string;
  age: number;
  classGrade: string;
  subjectPreference: string;
  aiGenderPref: 'boy' | 'girl';
  language: string;
  email: string;
  id?: string;
}

export enum ThemeType {
  DEFAULT = 'Default',
  GIRLS_INTERACTIVE = 'Girls Interactive',
  BOYS_INTERACTIVE = 'Boys Interactive',
  CUSTOM = 'Custom',
}

export enum ModelType {
  AUTO = 'Auto Mode (Best)',
  GEMINI = 'Gemini 1.5 Pro',
  LONGCAT = 'LongCat AI',
  OPENAI = 'OpenAI GPT-4',
  OPENROUTER = 'OpenRouter',
  EDEN = 'Eden AI'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  attachments?: FileAttachment[];
}

export interface FileAttachment {
  name: string;
  type: 'image' | 'video' | 'file';
  url: string; // Base64 or Blob URL
}

export interface NelaState {
  isVisible: boolean;
  currentFaceIndex: number; // Index in the emoji array
  position: { x: number; y: number };
}
