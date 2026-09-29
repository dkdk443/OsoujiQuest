import type { Task, Voice } from '../../shared/types';
import { Chiribo } from '../components/Chiribo';
import type { Photo } from '../lib/image';
import { line } from '../lib/lines';
import type { Quest } from '../lib/tasks';

type Props = {
  quest: Quest;
  photo: Photo;
  photoUrl: string;
  voice: Voice;
  doneIds: string[];
  showAll: boolean;
  onShowAll: (v: boolean) => void;
  onStart: (task: Task) => void;
  onHome: () => void;
};

const PHOTO_H = 240;
const xpOf = (t: Task) => (t.min === 2 ? 15 : 10);

export function Tasks({ quest, photo, photoUrl, voice, doneIds, showAll, onShowAll, onStart, onHome }: Props) {
  const { tasks } = quest;
  const isDone = (t: Task) => doneIds.includes(t.id);
  // 1個だけモード: できたもの＋次の1個だけ見せる
  const next = tasks.find(t => !isDone(t));
  const shown = showAll ? tasks : tasks.filter(t => isDone(t) || t === next);
  const hidden = tasks.length - shown.length;
  const numOf = (t: Task) => tasks.indexOf(t) + 1;

  return (
    <div className="screen" style={{ gap: 16, backgroundImage: 'none', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="back" onClick={onHome}>← ホーム</button>
        <div style={{ font: '400 13px var(--font-dot)', color: 'var(--sub)' }}>{doneIds.length}/{tasks.length} できた</div>
      </div>
      <div style={{ fontFamily: 'var(--font-dot)', fontSize: 26, lineHeight: 1.2 }}>チリボの指示書</div>

      {/* ピンの x・y は写真全体に対する 0〜1 なので、切り抜かずに縦横比のまま表示する */}
      <div
        className="photo"
        style={{ alignSelf: 'center', width: `min(100%, ${(PHOTO_H * photo.width) / photo.height}px)`, aspectRatio: `${photo.width} / ${photo.height}` }}
      >
        <img src={photoUrl} alt="撮影した部屋" />
        {quest.pinned && shown.map(t => (
          <button
            key={t.id}
            onClick={() => !isDone(t) && onStart(t)}
            aria-label={`タスク${numOf(t)}`}
            style={{
              // 端の物でもピンが枠からはみ出さないよう、中心を内側 17px に収める
              position: 'absolute', transform: 'translate(-50%, -50%)',
              left: `clamp(17px, ${t.x * 100}%, calc(100% - 17px))`,
              top: `clamp(17px, ${t.y * 100}%, calc(100% - 17px))`,
              width: 30, height: 30, padding: 0, border: '2.5px solid var(--ink)', borderRadius: 4,
              background: isDone(t) ? 'var(--mint)' : 'var(--butter)', boxShadow: '2px 2px 0 var(--ink)',
              font: '400 15px var(--font-dot)', color: 'var(--on-color)',
            }}
          >
            {numOf(t)}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 60, height: 70, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Chiribo mood="happy" size={50} />
        </div>
        <div className="bubble" style={{ flex: 1, maxWidth: 'none', boxShadow: 'none', padding: '12px 14px', fontSize: 14, lineHeight: 1.65 }}>
          <div className="bubble-name">チリボ</div>
          {quest.line ?? line('tasks', voice)}
        </div>
      </div>

      <div style={{ display: 'flex', border: '2.5px solid var(--ink)', borderRadius: 8, overflow: 'hidden', background: 'var(--paper)' }}>
        {([false, true] as const).map(all => {
          const on = showAll === all;
          return (
            <button
              key={String(all)}
              onClick={() => onShowAll(all)}
              aria-pressed={on}
              style={{
                flex: 1, height: 40, border: 0, borderLeft: all ? '2.5px solid var(--ink)' : 0,
                background: on ? 'var(--butter)' : 'var(--paper)', color: on ? 'var(--on-color)' : 'var(--text)',
                font: '700 13px var(--font-body)',
              }}
            >
              {all ? `ぜんぶ見る（${tasks.length}）` : '1個だけ'}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {shown.map(t => {
          const d = isDone(t);
          return (
            <button
              key={t.id}
              onClick={() => !d && onStart(t)}
              className="btn"
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: 12, textAlign: 'left',
                background: d ? 'var(--bg)' : 'var(--paper)', boxShadow: '3px 3px 0 var(--ink)',
              }}
            >
              <div style={{
                width: 34, height: 34, flex: 'none', border: '2.5px solid var(--ink)', borderRadius: 4,
                background: d ? 'var(--mint)' : 'var(--butter)', color: 'var(--on-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', font: '400 17px var(--font-dot)',
              }}>
                {d ? '✓' : numOf(t)}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ fontSize: 15, lineHeight: 1.4, textDecoration: d ? 'line-through' : 'none' }}>{t.text}</div>
                <div style={{ font: '400 12px var(--font-dot)', color: 'var(--sub)' }}>{t.min}分 ・ +{xpOf(t)}EXP</div>
              </div>
              <div style={{ font: '400 16px var(--font-dot)' }}>{d ? '' : '▶'}</div>
            </button>
          );
        })}
      </div>

      {hidden > 0 && (
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--sub)' }}>ほかに{hidden}個あるけど、今は見なくていい。</div>
      )}
    </div>
  );
}
