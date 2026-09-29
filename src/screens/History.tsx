import { useEffect, useState } from 'react';
import type { Profile, Session, Voice } from '../../shared/types';
import { Chiribo } from '../components/Chiribo';
import { TAB_SPACE } from '../components/TabBar';
import { db } from '../lib/db';
import { addDays, weekday, XP_PER_LEVEL } from '../lib/game';
import { line } from '../lib/lines';

type Props = {
  profile: Profile;
  restWeekdays: number[];
  today: string;
  voice: Voice;
};

type Row = Session & { id: number; thumb: string | null };

const WEEKS = 5;
const LIST_LIMIT = 30;

const md = (day: string) => `${Number(day.slice(5, 7))}/${Number(day.slice(8, 10))}`;

export function History({ profile, restWeekdays, today, voice }: Props) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [calendarDays, setCalendarDays] = useState<Map<string, 'clear' | 'rest'>>(new Map());
  // おやすみ曜日は、使いはじめた日より前には塗らない
  const [firstUsedDay, setFirstUsedDay] = useState<string | null>(null);

  // 月曜はじまりで、今週を最後の行にした5週間
  const mondayOffset = (weekday(today) + 6) % 7;
  const firstDay = addDays(today, -mondayOffset - (WEEKS - 1) * 7);

  useEffect(() => {
    const urls: string[] = [];
    let alive = true;
    (async () => {
      const inRange = await db.sessions.where('day').aboveOrEqual(firstDay).toArray();
      const marks = new Map<string, 'clear' | 'rest'>();
      for (const s of inRange) {
        if (s.kind === 'clear' && s.doneIds.length > 0) marks.set(s.day, 'clear');
        else if (s.kind === 'rest' && !marks.has(s.day)) marks.set(s.day, 'rest');
      }

      const first = await db.sessions.orderBy('day').first();
      const recent = await db.sessions.orderBy('day').reverse().limit(LIST_LIMIT).toArray();
      const photos = await db.photos.bulkGet(recent.map(s => s.beforePhotoId ?? -1));
      const list = recent.map((s, i) => {
        const p = photos[i];
        const thumb = p ? URL.createObjectURL(p.blob) : null;
        if (thumb) urls.push(thumb);
        return { ...s, thumb };
      });
      if (!alive) return;
      setCalendarDays(marks);
      setFirstUsedDay(first?.day ?? null);
      setRows(list);
    })().catch(err => console.error('history load failed', err));
    return () => {
      alive = false;
      urls.forEach(u => URL.revokeObjectURL(u));
    };
  }, [firstDay]);

  const cells = Array.from({ length: WEEKS * 7 }, (_, i) => {
    const day = addDays(firstDay, i);
    if (day > today) return { day, bg: 'transparent', border: 'rgba(128,128,128,.25)' };
    const mark = calendarDays.get(day) ?? (firstUsedDay && day > firstUsedDay && day < today && restWeekdays.includes(weekday(day)) ? 'rest' : undefined);
    if (mark === 'clear') return { day, bg: 'var(--mint)', border: 'var(--ink)' };
    if (mark === 'rest') return { day, bg: 'var(--lav)', border: 'var(--ink)' };
    return { day, bg: 'var(--paper)', border: day === today ? 'var(--ink)' : 'rgba(128,128,128,.4)' };
  });

  const card = (bg: string) => ({
    flex: 1, padding: 14, border: '2.5px solid var(--ink)', borderRadius: 10, background: bg, boxShadow: '3px 3px 0 var(--ink)',
    display: 'flex', flexDirection: 'column' as const, gap: 4, color: 'var(--on-color)',
  });

  return (
    <div className="screen" style={{ gap: 18, backgroundImage: 'none', paddingBottom: TAB_SPACE }}>
      <div style={{ fontFamily: 'var(--font-dot)', fontSize: 26 }}>きろく</div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={card('var(--butter)')}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>連続</div>
          <div style={{ font: '400 44px/1 var(--font-dot)' }}>{profile.streak}<span style={{ fontSize: 18 }}>日</span></div>
          <div style={{ fontSize: 11 }}>おやすみ日もカウント</div>
        </div>
        <div style={card('var(--lav)')}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>レベル</div>
          <div style={{ font: '400 44px/1 var(--font-dot)' }}>{profile.level}</div>
          <div style={{ fontSize: 11 }}>あと{XP_PER_LEVEL - profile.xp}EXP</div>
        </div>
      </div>

      <div style={{ padding: 14, border: '2.5px solid var(--ink)', borderRadius: 10, background: 'var(--paper)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>この5週間</div>
          <div style={{ font: '400 11px var(--font-dot)', color: 'var(--sub)' }}>月 → 日</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {cells.map(c => (
            <div key={c.day} title={c.day} style={{ aspectRatio: '1', border: `2px solid ${c.border}`, borderRadius: 3, background: c.bg }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--sub)' }}>
          {[['var(--mint)', 'そうじした'], ['var(--lav)', 'おやすみ日'], ['var(--paper)', 'なにもなし']].map(([bg, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, border: '2px solid var(--ink)', background: bg }} />{label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 56, height: 64, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Chiribo size={50} />
        </div>
        <div style={{ padding: '9px 12px', border: '2.5px solid var(--ink)', borderRadius: 8, background: 'var(--paper)', fontSize: 13, lineHeight: 1.5 }}>
          {line('history', voice)}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows?.length === 0 && (
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--sub)', padding: 12 }}>まだきろくはないよ。1個やってみよ〜</div>
        )}
        {rows?.map(s => {
          const rest = s.kind === 'rest';
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, border: '2.5px solid var(--ink)', borderRadius: 10, background: 'var(--paper)' }}>
              <div style={{
                width: 56, height: 56, flex: 'none', border: '2px solid var(--ink)', borderRadius: 6, overflow: 'hidden',
                background: s.thumb ? `center / cover url(${s.thumb})` : 'var(--stripe)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', font: '9px ui-monospace, monospace', color: 'var(--sub)',
              }}>
                {!s.thumb && (rest ? 'Zzz' : '写真')}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {s.day === today ? '今日　' : ''}{rest ? 'おやすみ日' : `${s.doneIds.length}個 片づけた`}
                </div>
                <div style={{ font: '400 12px var(--font-dot)', color: 'var(--sub)' }}>
                  {md(s.day)}{rest ? '' : ` ・ +${s.gainedXp}EXP`}
                </div>
              </div>
              <div className="chip" style={{ padding: '3px 8px', background: rest ? 'var(--lav)' : 'var(--mint)', fontSize: 12 }}>
                {rest ? 'ZZZ' : 'CLEAR'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
