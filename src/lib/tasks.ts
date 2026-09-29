import type { AnalyzeResponse, RawTask, Task, Voice } from '../../shared/types';
import { toBase64 } from './image';

export type Quest = {
  tasks: Task[];
  line: string | null; // AIのひとこと。null なら辞書のセリフを使う
  pinned: boolean; // 予備タスクのときは写真にピンを出さない
};

// API失敗・オフライン時の予備タスク
const FALLBACK: Omit<Task, 'id'>[] = [
  { text: '床のものを1つ拾う', min: 1, x: 0, y: 0 },
  { text: 'ゴミを3つすてる', min: 1, x: 0, y: 0 },
  { text: '服を1枚たたむか、かける', min: 1, x: 0, y: 0 },
  { text: '机の上の物を1か所にまとめる', min: 2, x: 0, y: 0 },
  { text: 'コップや食器を1つ片づける', min: 1, x: 0, y: 0 },
  { text: '本や雑誌を3冊重ねる', min: 1, x: 0, y: 0 },
  { text: 'リモコンを定位置にもどす', min: 1, x: 0, y: 0 },
  { text: '床の紙類を1か所にまとめる', min: 2, x: 0, y: 0 },
  { text: '靴をそろえて並べる', min: 1, x: 0, y: 0 },
  { text: 'クッションを整えて置く', min: 1, x: 0, y: 0 },
];

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

// AIの返事を信用せず、件数・文字数・座標の範囲を確かめてから id を振る
function validate(raw: RawTask[], count: number): Task[] {
  return raw
    .filter(t => typeof t?.text === 'string' && t.text.trim() !== '' && [...t.text.trim()].length <= 25)
    .filter(t => Number.isFinite(t.x) && Number.isFinite(t.y))
    .slice(0, count)
    .map((t, i) => ({
      id: `t${i + 1}`,
      text: t.text.trim(),
      min: t.min === 2 ? 2 : 1,
      x: clamp01(t.x),
      y: clamp01(t.y),
    }));
}

export function fallbackQuest(count: number): Quest {
  return {
    tasks: FALLBACK.slice(0, count).map((t, i) => ({ ...t, id: `t${i + 1}` })),
    line: null,
    pinned: false,
  };
}

export async function analyzePhoto(photo: Blob, count: number, voice: Voice): Promise<Quest> {
  if (!navigator.onLine) return fallbackQuest(count);
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ image: await toBase64(photo), count, voice }),
      signal: AbortSignal.timeout(25_000),
    });
    const data = (await res.json()) as AnalyzeResponse;
    if ('error' in data) return fallbackQuest(count);
    const tasks = validate(data.tasks, count);
    if (tasks.length === 0) return fallbackQuest(count);
    const line = typeof data.line === 'string' && data.line.trim() && [...data.line].length <= 30 ? data.line.trim() : null;
    return { tasks, line, pinned: true };
  } catch {
    return fallbackQuest(count);
  }
}
