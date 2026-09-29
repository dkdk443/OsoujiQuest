// フロント（src/）と関数（functions/）の両方で使う型

export type Voice = 'ふんわり' | 'げんき';

export type Task = {
  id: string;
  text: string; // 例: 「ペットボトルを3本すてる」
  min: 1 | 2; // 所要分
  x: number; // 写真上の位置 0〜1
  y: number;
};

export type Session = {
  id?: number;
  day: string; // 'YYYY-MM-DD'（4時区切りの論理日）
  kind: 'clear' | 'rest';
  tasks: Task[];
  doneIds: string[];
  gainedXp: number;
  beforePhotoId?: number;
  afterPhotoId?: number;
};

export type Profile = {
  xp: number; // 0〜99。100でレベルアップして持ち越し
  level: number;
  streak: number;
  lastCountedDay: string | null;
};

// POST /api/analyze
export const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;
export const MAX_TASKS = 10;

export type AnalyzeRequest = {
  image: string; // base64 JPEG（data: プレフィックスなし）
  count: number; // 1〜MAX_TASKS
  voice: Voice;
};

// AIが返すままの形。id はまだ無く、端末で再検証してから Task にする
export type RawTask = { text: string; min: number; x: number; y: number };

export type AnalyzeResponse =
  | { tasks: RawTask[]; line: string }
  | { error: 'too_large' | 'ai_failed' };

// POST /api/review（ビフォーとアフターを見くらべる。写真はどちらも保存しない）
// マスは写真を3×3に分けた番号。0=左上 1=上 2=右上 3=左 4=まんなか 5=右 6=左下 7=下 8=右下
export type ReviewRequest = {
  before: string; // base64 JPEG
  after: string;
  done: string[]; // 今日やったタスクの文
  voice: Voice;
};

// AIが返すままの形。端末で再検証してから使う。点数はつけない（ほめるだけ）
export type RawReview = {
  head: string;
  summary: string;
  praise: { cell: number; text: string }[];
  advice: { cell: number; text: string; why: string }[];
};

export type ReviewResponse = RawReview | { error: 'too_large' | 'ai_failed' };
