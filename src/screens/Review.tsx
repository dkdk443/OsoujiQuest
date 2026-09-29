import { useEffect, useState } from 'react';
import { Chiribo } from '../components/Chiribo';
import type { Photo } from '../lib/image';
import { cellCenter, type Review as ReviewData } from '../lib/review';

type Advice = ReviewData['advice'][number];

type Props = {
  review: ReviewData | null; // null のあいだは解析中
  after: Photo;
  afterUrl: string;
  added: string[]; // ミッションに入れたアドバイスの文
  onAdd: (a: Advice) => void;
  onPlay: () => void; // ミッションに入れたアドバイスをやりに、指示書へもどる
  onBack: () => void;
  onHistory: () => void;
};

const SEGS = 10;
const MSGS = ['ビフォーとアフター、ならべるね…', 'じ〜っ…', 'あっ、ここ変わってる！', 'ほめるところ、いっぱいある〜', 'まとめちゅう…'];
// 写真の高さの上限。ピンの位置は写真全体に対する割合なので、切り抜かずに縦横比のまま出す
const PHOTO_H = '36svh';

const heading = { font: '400 12px var(--font-dot)', color: 'var(--sub)', letterSpacing: '.06em' };
const numBox = (bg: string) => ({
  width: 30, height: 30, flex: 'none', border: '2.5px solid var(--ink)', borderRadius: 4, background: bg,
  color: 'var(--on-color)', font: '400 14px/25px var(--font-dot)', textAlign: 'center' as const, boxSizing: 'border-box' as const,
});
const letter = (i: number) => String.fromCharCode(65 + i);

export function Review({ review, after, afterUrl, added, onAdd, onPlay, onBack, onHistory }: Props) {
  const [waiting, setWaiting] = useState(0);
  const n = review ? SEGS : waiting;

  // 待っている間は SEGS-1 まで少しずつ進める
  useEffect(() => {
    if (review) return;
    const t = setInterval(() => setWaiting(v => Math.min(SEGS - 1, v + 1)), 260);
    return () => clearInterval(t);
  }, [review]);

  const pins = review
    ? [
      ...review.praise.map((p, i) => ({ key: `p${i}`, label: String(i + 1), bg: 'var(--mint)', ...cellCenter(p.cell) })),
      ...review.advice.map((a, i) => ({ key: `a${i}`, label: letter(i), bg: 'var(--butter)', ...cellCenter(a.cell) })),
    ]
    : [];

  return (
    <div className="screen" style={{ gap: 16, backgroundImage: 'none', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="back" onClick={onBack}>← くらべる</button>
        <div style={{ font: '400 12px var(--font-dot)', color: 'var(--sub)' }}>
          {review && (review.source === 'ai' ? 'AIで解析' : '端末で解析')}
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-dot)', fontSize: 26, lineHeight: 1.2 }}>チリボのしんだん</div>

      {!review && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, paddingBottom: 40 }}>
          <div style={{ width: 150, height: 175, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Chiribo mood="side" size={150} />
          </div>
          <div style={{ display: 'flex', gap: 4, width: 220 }}>
            {Array.from({ length: SEGS }, (_, i) => (
              <div key={i} style={{ flex: 1, height: 14, border: '2px solid var(--ink)', background: i < n ? 'var(--pink)' : 'var(--paper)' }} />
            ))}
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.6, textAlign: 'center' }}>{MSGS[Math.min(MSGS.length - 1, Math.floor(n / 2))]}</div>
        </div>
      )}

      {review && (
        <>
          <div
            className="photo"
            style={{ alignSelf: 'center', width: `min(100%, calc(${PHOTO_H} * ${after.width / after.height}))`, aspectRatio: `${after.width} / ${after.height}` }}
          >
            <img src={afterUrl} alt="アフター" />
            {pins.map(p => (
              <div
                key={p.key}
                style={{
                  position: 'absolute', left: `${p.x * 100}%`, top: `${p.y * 100}%`, margin: '-15px 0 0 -15px',
                  ...numBox(p.bg), boxShadow: '2px 2px 0 var(--ink)',
                }}
              >
                {p.label}
              </div>
            ))}
            <div style={{
              position: 'absolute', top: 10, right: 10, padding: '2px 8px', background: 'var(--mint)', border: '2px solid var(--ink)',
              borderRadius: 3, font: '400 12px var(--font-dot)', color: 'var(--on-color)',
            }}>AFTER</div>
          </div>

          <div style={{
            padding: '14px 16px', border: '2.5px solid var(--ink)', borderRadius: 10, background: 'var(--butter)',
            boxShadow: '3px 3px 0 var(--ink)', color: 'var(--on-color)', font: '400 20px/1.4 var(--font-dot)', textWrap: 'pretty', animation: 'pop .5s',
          }}>
            {review.head}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={heading}>ここがえらい！</div>
            {review.praise.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, border: '2.5px solid var(--ink)', borderRadius: 10, background: 'var(--paper)' }}>
                <div style={numBox('var(--mint)')}>{i + 1}</div>
                <div style={{ flex: 1, fontSize: 14, lineHeight: 1.6, textWrap: 'pretty', paddingTop: 3 }}>{p.text}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={heading}>つぎは ここ</div>
            {review.advice.map((a, i) => {
              const on = added.includes(a.text);
              return (
                <div key={i} style={{
                  display: 'flex', flexDirection: 'column', gap: 10, padding: 12, border: '2.5px solid var(--ink)', borderRadius: 10,
                  background: 'var(--paper)', boxShadow: '3px 3px 0 var(--ink)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={numBox('var(--butter)')}>{letter(i)}</div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 3 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.5, textWrap: 'pretty' }}>{a.text}</div>
                      <div style={{ font: '400 12px var(--font-dot)', color: 'var(--sub)' }}>1分{a.why ? ` ・ ${a.why}` : ''}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onAdd(a)}
                    disabled={on}
                    style={{
                      alignSelf: 'flex-end', height: 36, padding: '0 12px', border: '2.5px solid var(--ink)', borderRadius: 6,
                      background: on ? 'var(--mint)' : 'var(--butter)', font: '400 13px var(--font-dot)', color: 'var(--on-color)', whiteSpace: 'nowrap',
                    }}
                  >
                    {on ? '✓ ミッションに入れた' : 'つぎのミッションにする'}
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ width: 56, height: 64, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Chiribo mood="blush" size={50} />
            </div>
            <div className="bubble" style={{ flex: 1, maxWidth: 'none', boxShadow: 'none', padding: '12px 14px', fontSize: 14, lineHeight: 1.65 }}>
              <div className="bubble-name">チリボ</div>
              {review.summary}
            </div>
          </div>

          {added.length > 0 && (
            <button className="btn" style={{ height: 50, flex: 'none', fontSize: 14, fontWeight: 700 }} onClick={onPlay}>
              入れたミッションをやる
            </button>
          )}
          <button className="btn btn-primary" style={{ height: 58, flex: 'none', fontSize: 19 }} onClick={onHistory}>
            きろくを見る
          </button>
        </>
      )}
    </div>
  );
}
