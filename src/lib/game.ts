import type { Profile, Task } from '../../shared/types';

// EXPはAIに決めさせず、所要分から端末で計算する
export const xpFor = (t: Task) => (t.min === 2 ? 15 : 10);

export const XP_PER_LEVEL = 100;

// 100 EXPごとにレベル+1。余りは持ち越す（例: 95 + 10 → Lv+1、残り5）
export function gainXp(p: Profile, gained: number): { profile: Profile; leveled: boolean } {
  let xp = p.xp + gained;
  let level = p.level;
  while (xp >= XP_PER_LEVEL) {
    xp -= XP_PER_LEVEL;
    level += 1;
  }
  return { profile: { ...p, xp, level }, leveled: level > p.level };
}

// ---- 論理日 ----
// 'YYYY-MM-DD'。朝4:00で日付が切り替わり、0:00〜3:59 は前日扱い

const DAY_START_HOUR = 4;
const pad = (n: number) => String(n).padStart(2, '0');

export function logicalDay(now: Date = new Date()): string {
  const d = new Date(now.getTime() - DAY_START_HOUR * 60 * 60 * 1000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 日付文字列の計算はタイムゾーンの影響を受けないよう UTC で行う
const toUtc = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export const addDays = (day: string, n: number) => fromUtc(toUtc(day) + n * 86_400_000);
export const nextDay = (day: string) => addDays(day, 1);
export const prevDay = (day: string) => addDays(day, -1);
export const weekday = (day: string) => new Date(toUtc(day)).getUTCDay(); // 0=日

// ---- 連続記録 ----
// lastCountedDay = 最後に連続記録を +1 した論理日

// 片づけ完了 or 「今日はサボる」のとき。1日1回まで
export function countToday(p: Profile, today: string): Profile {
  if (p.lastCountedDay === today) return p;
  return { ...p, streak: p.streak + 1, lastCountedDay: today };
}

// アプリを開いたとき：昨日までの空白日を順に判定する。
// 片づけた日は完了時点で数え済みなので、ここで見るのは「何もしなかった日」だけ
export function catchUp(p: Profile, restWeekdays: number[], today: string): Profile {
  if (!p.lastCountedDay) return p;
  let { streak, lastCountedDay } = p;
  for (let d = nextDay(lastCountedDay); d < today; d = nextDay(d)) {
    if (restWeekdays.includes(weekday(d))) {
      streak += 1;
      lastCountedDay = d;
    } else {
      streak = 0;
      lastCountedDay = prevDay(today);
      break;
    }
  }
  return { ...p, streak, lastCountedDay };
}
