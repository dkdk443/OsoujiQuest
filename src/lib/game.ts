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
