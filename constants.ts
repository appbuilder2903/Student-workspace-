import { ModelType } from './types';

// NOTE: in a real production app, these lists would be fetched or more extensive.
// Using emojis as requested "Use normal 20 emoji insted of svg faces"

export const GIRL_EMOJIS = [
  '👩', '👧', '👱‍♀️', '👩‍🦰', '👩‍🦱', '👩‍white_haired', '👩‍🦲', '👸', '👰‍♀️', '🙍‍♀️'
];

export const BOY_EMOJIS = [
  '👨', '👦', '👱‍♂️', '👨‍🦰', '👨‍🦱', '👨‍white_haired', '👨‍🦲', '🤴', '🤵‍♂️', '🙍‍♂️'
];

export const ALL_AVATARS = [...GIRL_EMOJIS, ...BOY_EMOJIS];

// Nela 2.0 Movie Character Avatar (Amy Jackson Robot)
// Using a reliable source for the visual representation
export const NELA_DEFAULT_AVATAR = 'https://wallpapercave.com/wp/wp3833676.jpg';

export const AVAILABLE_MODELS = [
  { id: ModelType.AUTO, label: '✨ Auto Mode (Best)' },
  { id: ModelType.GEMINI, label: 'Gemini 1.5 Pro' },
  { id: ModelType.LONGCAT, label: 'LongCat AI' },
  { id: ModelType.OPENAI, label: 'OpenAI GPT-4' },
  { id: ModelType.OPENROUTER, label: 'OpenRouter' },
];

export const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Literature', 'History', 'Geography'
];

// Mock database for the "Nuke.nuke" ID requirement
export const MASTER_ID = 'Nuke.nuke';
export const MASTER_PASS = 'Neo29032012Neo';
export const MASTER_GLOBAL_PASS = 'Neo2903202Neo';

export const PENTEST_URL = "https://pentest.org";