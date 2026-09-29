import type { CSSProperties } from 'react';

export type Mood = 'normal' | 'happy' | 'blush' | 'sleep' | 'side';

type Props = { mood?: Mood; size: number };

// プロトタイプの bot() を移植。色はテーマのCSS変数を使う
export function Chiribo({ mood = 'normal', size: s }: Props) {
  const b = 3;
  const ink = 'var(--ink)';
  const glow = 'var(--glow)';

  const eye = (side: 'left' | 'right') => {
    const st: CSSProperties = {
      position: 'absolute', top: '32%', [side]: '20%',
      width: s * 0.11, height: s * 0.12, background: glow, borderRadius: 1, animation: 'blink 4s infinite',
    };
    if (mood === 'happy' || mood === 'blush') Object.assign(st, { height: s * 0.05, top: '38%', borderRadius: s, animation: 'none' });
    if (mood === 'sleep') Object.assign(st, { height: s * 0.025, top: '44%', animation: 'none' });
    if (mood === 'side') st[side] = side === 'left' ? '44%' : '8%';
    return <div style={st} />;
  };

  const cheek = (side: 'left' | 'right') => (
    <div style={{ position: 'absolute', bottom: '22%', [side]: '6%', width: s * 0.1, height: s * 0.06, background: 'var(--cheek)', borderRadius: 2 }} />
  );

  const arm = (side: 'left' | 'right') => (
    <div style={{
      position: 'absolute', top: s * 0.36, [side]: -s * 0.06, width: s * 0.1, height: s * 0.2,
      border: `${b}px solid ${ink}`, borderRadius: 3, background: 'var(--butter)', boxSizing: 'border-box',
    }} />
  );

  return (
    <div
      aria-hidden
      style={{ position: 'relative', width: s, height: s * 1.15, flex: 'none', animation: mood === 'sleep' ? 'none' : 'bob 2.4s ease-in-out infinite' }}
    >
      {/* アンテナ */}
      <div style={{
        position: 'absolute', left: '50%', top: 0, width: s * 0.13, height: s * 0.13, marginLeft: -s * 0.065,
        borderRadius: '50%', border: `${b}px solid ${ink}`, background: 'var(--pink)', boxSizing: 'border-box',
      }} />
      <div style={{ position: 'absolute', left: '50%', top: s * 0.12, width: b + 1, height: s * 0.06, marginLeft: -(b + 1) / 2, background: ink }} />
      {arm('left')}
      {arm('right')}
      {/* 胴体 */}
      <div style={{
        position: 'absolute', top: s * 0.8, left: '24%', width: '52%', height: s * 0.32,
        border: `${b}px solid ${ink}`, borderRadius: s * 0.06, background: 'var(--lav)', boxSizing: 'border-box', boxShadow: `3px 3px 0 ${ink}`,
      }}>
        <div style={{
          position: 'absolute', left: '50%', top: '28%', width: s * 0.08, height: s * 0.08, marginLeft: -s * 0.04,
          background: 'var(--pink)', border: `2px solid ${ink}`, boxSizing: 'border-box',
        }} />
      </div>
      {/* 頭と顔 */}
      <div style={{
        position: 'absolute', top: s * 0.17, left: 0, width: s, height: s * 0.66,
        border: `${b}px solid ${ink}`, borderRadius: s * 0.14, background: 'var(--mint)', boxSizing: 'border-box', boxShadow: `4px 4px 0 ${ink}`,
      }}>
        <div style={{ position: 'absolute', left: '11%', top: '14%', width: '78%', height: '64%', background: ink, borderRadius: s * 0.08 }}>
          {eye('left')}
          {eye('right')}
          <div style={{
            position: 'absolute', bottom: '16%', left: '50%', transform: 'translateX(-50%)',
            width: s * (mood === 'happy' ? 0.2 : 0.11), height: s * 0.035, background: glow,
            borderRadius: mood === 'happy' ? '0 0 8px 8px' : 1,
          }} />
          {mood !== 'sleep' && cheek('left')}
          {mood !== 'sleep' && cheek('right')}
        </div>
      </div>
    </div>
  );
}
