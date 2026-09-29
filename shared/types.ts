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
