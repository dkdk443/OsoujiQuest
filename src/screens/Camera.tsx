import type { Voice } from '../../shared/types';
import { Chiribo } from '../components/Chiribo';
import { line } from '../lib/lines';

type Props = {
  voice: Voice;
  onPick: (file: File) => void;
  onCancel: () => void;
};

const corner = (v: 'top' | 'bottom', h: 'left' | 'right') => ({
  position: 'absolute' as const,
  [v]: 0,
  [h]: 0,
  width: 34,
  height: 34,
  [`border${v === 'top' ? 'Top' : 'Bottom'}`]: '5px solid #fffdf7',
  [`border${h === 'left' ? 'Left' : 'Right'}`]: '5px solid #fffdf7',
});

// 標準カメラを file input で起動する。ストリームは扱わない
export function Camera({ voice, onPick, onCancel }: Props) {
  return (
    <div className="screen" style={{ background: 'var(--stripe)', padding: 0 }}>
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 110px)', left: 28, right: 28, bottom: 200, pointerEvents: 'none' }}>
        <div style={corner('top', 'left')} />
        <div style={corner('top', 'right')} />
        <div style={corner('bottom', 'left')} />
        <div style={corner('bottom', 'right')} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', font: '12px ui-monospace, Menlo, monospace', color: '#8a8594' }}>
          お部屋がぜんぶ入るように
        </div>
      </div>

      <div style={{ position: 'relative', margin: 'calc(env(safe-area-inset-top) + 20px) 16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 52, height: 60, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Chiribo size={50} />
        </div>
        <div style={{ padding: '9px 12px', border: '2.5px solid var(--ink)', borderRadius: 8, background: 'var(--paper)', fontSize: 13, lineHeight: 1.5 }}>
          {line('cam', voice)}
        </div>
      </div>

      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '20px 28px calc(env(safe-area-inset-bottom) + 40px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(transparent, rgba(0,0,0,.5))',
      }}>
        <button className="back" style={{ width: 76, color: '#fffdf7', textAlign: 'left' }} onClick={onCancel}>
          やめとく
        </button>
        <label
          aria-label="撮影する"
          style={{
            width: 78, height: 78, borderRadius: '50%', border: '5px solid #fffdf7', background: 'var(--pink)',
            boxShadow: '0 0 0 3px #2a2833', cursor: 'pointer',
          }}
        >
          <input
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={e => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) onPick(f);
            }}
          />
        </label>
        <div style={{ width: 76, textAlign: 'right', font: '400 13px var(--font-dot)', color: '#fffdf7' }}>BEFORE</div>
      </div>
    </div>
  );
}
