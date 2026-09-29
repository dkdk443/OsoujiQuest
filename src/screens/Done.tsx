import type { Profile, Voice } from '../../shared/types';
import { Chiribo } from '../components/Chiribo';
import { XpBar } from '../components/XpBar';
import { line } from '../lib/lines';

type Props = {
  profile: Profile;
  gained: number;
  leveled: boolean;
  hasNext: boolean;
  voice: Voice;
  onOneMore: () => void;
  onHome: () => void;
};

// ステップ5で「アフターを撮って比べる」を足す
export function Done({ profile, gained, leveled, hasNext, voice, onOneMore, onHome }: Props) {
  return (
    <div className="screen" style={{ backgroundColor: 'var(--bg-done)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '20px 0' }}>
        <div style={{ font: '400 56px var(--font-dot)', letterSpacing: '.06em', animation: 'pop .5s' }}>CLEAR!</div>
        <div className="chip" style={{ padding: '6px 14px', border: '2.5px solid var(--ink)', background: 'var(--paper)', boxShadow: '3px 3px 0 var(--ink)', fontSize: 20, color: 'var(--text)' }}>
          +{gained} EXP
        </div>
        {leveled && (
          <div className="chip" style={{ padding: '6px 14px', border: '2.5px solid var(--ink)', background: 'var(--lav)', fontSize: 16, animation: 'pop .6s' }}>
            LEVEL UP → Lv.{profile.level}
          </div>
        )}
        <div style={{ width: 150, height: 175, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Chiribo mood="blush" size={150} />
        </div>
        <div className="bubble" style={{ maxWidth: 300, boxShadow: 'none' }}>
          <div className="bubble-name">チリボ</div>
          {line('done', voice)}
        </div>
        <div style={{ width: '100%' }}>
          <XpBar label={`Lv.${profile.level}`} xp={profile.xp} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {hasNext && (
          <button className="btn btn-primary" style={{ flex: 1, height: 58, fontSize: 19 }} onClick={onOneMore}>
            もう1個だけ
          </button>
        )}
        <button className="btn" style={{ flex: 1, height: 58 }} onClick={onHome}>今日はここまで</button>
      </div>
    </div>
  );
}
