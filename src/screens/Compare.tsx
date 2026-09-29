import { useState } from 'react';
import type { Voice } from '../../shared/types';
import { Chiribo } from '../components/Chiribo';
import { line } from '../lib/lines';

type Props = {
  beforeUrl: string;
  afterUrl: string;
  doneCount: number;
  voice: Voice;
  onHome: () => void;
  onHistory: () => void;
};

// 2枚を重ね、上のアフターを clip-path: inset() で左から削ってスライダーで動かす
export function Compare({ beforeUrl, afterUrl, doneCount, voice, onHome, onHistory }: Props) {
  const [cmp, setCmp] = useState(50);
  const label = { position: 'absolute' as const, top: 10, padding: '2px 8px', borderRadius: 3, font: '400 12px var(--font-dot)' };

  return (
    <div className="screen" style={{ gap: 16, backgroundImage: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="back" onClick={onHome}>← ホーム</button>
        <div style={{ font: '400 13px var(--font-dot)', color: 'var(--sub)' }}>{doneCount}個 片づけた</div>
      </div>
      <div style={{ fontFamily: 'var(--font-dot)', fontSize: 26 }}>ビフォー / アフター</div>

      <div className="photo" style={{ flex: 1, minHeight: 280 }}>
        <img src={beforeUrl} alt="ビフォー" />
        <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 0 0 ${cmp}%)` }}>
          <img src={afterUrl} alt="アフター" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${cmp}%`, width: 3, marginLeft: -1.5, background: 'var(--ink)' }} />
        <div style={{ ...label, left: 10, background: 'var(--ink)', color: '#fffdf7' }}>BEFORE</div>
        <div style={{ ...label, right: 10, background: 'var(--mint)', border: '2px solid var(--ink)', color: 'var(--on-color)' }}>AFTER</div>
      </div>

      <input
        className="yz"
        type="range"
        min={0}
        max={100}
        value={cmp}
        onChange={e => setCmp(Number(e.target.value))}
        aria-label="ビフォーとアフターの境目"
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 56, height: 64, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Chiribo mood="happy" size={50} />
        </div>
        <div style={{ padding: '9px 12px', border: '2.5px solid var(--ink)', borderRadius: 8, background: 'var(--paper)', fontSize: 13, lineHeight: 1.5 }}>
          {line('compare', voice)}
        </div>
      </div>

      <button className="btn btn-primary" style={{ height: 58, flex: 'none', fontSize: 19 }} onClick={onHistory}>
        きろくを見る
      </button>
    </div>
  );
}
