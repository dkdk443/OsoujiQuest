import { useEffect, useState } from 'react';
import { Chiribo } from '../components/Chiribo';

type Props = {
  photoUrl: string;
  done: boolean; // 解析の応答が来たら true
  onFinish: () => void;
};

const SEGS = 12;
const MSGS = ['お部屋よみこみちゅう…', 'ふむふむ…', 'いろいろ見えてきた！', 'これならいけそう〜！', '1分でできることに分けたよ！'];

// 固定時間ではなく、応答が来たら最後まで埋めて次へ進む
export function Scan({ photoUrl, done, onFinish }: Props) {
  const [waiting, setWaiting] = useState(0);
  const n = done ? SEGS : waiting;

  // 待っている間は SEGS-1 まで少しずつ進める
  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setWaiting(v => Math.min(SEGS - 1, v + 1)), 700);
    return () => clearInterval(t);
  }, [done]);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(onFinish, 500);
    return () => clearTimeout(t);
  }, [done, onFinish]);

  const msg = done ? MSGS[MSGS.length - 1] : MSGS[Math.min(MSGS.length - 2, Math.floor(n / 3))];

  return (
    <div className="screen" style={{ gap: 22, backgroundImage: 'none' }}>
      <div style={{ fontFamily: 'var(--font-dot)', fontSize: 22, textAlign: 'center' }}>スキャン中…</div>
      <div className="photo" style={{ height: 300 }}>
        <img src={photoUrl} alt="" />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(160,230,210,.12)' }} />
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 4, background: 'oklch(0.7 0.12 170)',
          boxShadow: '0 0 18px 6px oklch(0.86 0.07 170)', animation: 'scanline 2.2s linear infinite',
        }} />
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: SEGS }, (_, i) => (
          <div key={i} style={{ flex: 1, height: 16, border: '2px solid var(--ink)', background: i < n ? 'var(--mint)' : 'var(--paper)' }} />
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 80, height: 92, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Chiribo mood="side" size={72} />
        </div>
        <div className="bubble" style={{ flex: 1, boxShadow: 'none' }}>
          <div className="bubble-name">チリボ</div>
          {msg}
        </div>
      </div>
    </div>
  );
}
