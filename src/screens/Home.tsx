import { useState } from 'react';
import type { Profile, Voice } from '../../shared/types';
import { Chiribo } from '../components/Chiribo';
import { line } from '../lib/lines';

type Props = {
  profile: Profile;
  voice: Voice;
  restToday: boolean;
  oneMode: boolean;
  onToggleOneMode: () => void;
  onShoot: () => void;
  onRest: () => void;
};

export function Home({ profile, voice, restToday, oneMode, onToggleOneMode, onShoot, onRest }: Props) {
  const [skipOpen, setSkipOpen] = useState(false);

  return (
    <div className="screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="title">おそうじクエスト</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="chip" style={{ background: 'var(--butter)' }}>連続 {profile.streak}日</div>
          <div className="chip" style={{ background: 'var(--lav)' }}>Lv.{profile.level}</div>
        </div>
      </div>

      <div className="xpbar" style={{ marginTop: 14 }}>
        <div>EXP</div>
        <div className="xpbar-track">
          <div className="xpbar-fill" style={{ width: `${profile.xp}%` }} />
        </div>
        <div>{profile.xp}/100</div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '24px 0' }}>
        <div className="bubble">
          <div className="bubble-name">チリボ</div>
          {line(restToday ? 'rest' : 'home', voice)}
        </div>
        <div style={{ width: 170, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Chiribo mood={restToday ? 'sleep' : 'normal'} size={150} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={onToggleOneMode}
          aria-pressed={oneMode}
          style={{
            alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
            border: '2px solid var(--ink)', borderRadius: 999, background: 'var(--paper)', font: '500 13px var(--font-body)',
          }}
        >
          <span style={{
            position: 'relative', width: 34, height: 18, border: '2px solid var(--ink)', borderRadius: 999,
            background: oneMode ? 'var(--mint)' : 'var(--paper)',
          }}>
            <span style={{
              position: 'absolute', top: 1, left: oneMode ? 17 : 1, width: 12, height: 12,
              borderRadius: '50%', background: 'var(--ink)', transition: 'left .2s',
            }} />
          </span>
          今日は1個だけモード
        </button>

        <button
          className="btn btn-primary"
          onClick={onShoot}
          style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}
        >
          <span style={{ position: 'relative', width: 18, height: 14, border: '2.5px solid var(--ink)', borderRadius: 3 }}>
            <span style={{ position: 'absolute', left: 4, top: 2, width: 6, height: 6, borderRadius: '50%', background: 'var(--ink)' }} />
          </span>
          部屋をパシャる
        </button>

        {!restToday && (
          <button className="link" style={{ alignSelf: 'center' }} onClick={() => setSkipOpen(true)}>
            今日はサボる
          </button>
        )}
      </div>

      {skipOpen && (
        <div className="sheet-backdrop" onClick={() => setSkipOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div style={{ width: 110, height: 128, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Chiribo mood="sleep" size={96} />
            </div>
            <div style={{ fontFamily: 'var(--font-dot)', fontSize: 22 }}>おやすみ日にする？</div>
            <div style={{ fontSize: 14, lineHeight: 1.7, textAlign: 'center', color: 'var(--sub)', textWrap: 'pretty' }}>
              「{line('skip', voice)}」<br />連続記録はとぎれないよ。
            </div>
            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <button className="btn" style={{ flex: 1, height: 52, borderRadius: 8 }} onClick={() => setSkipOpen(false)}>
                やっぱやる
              </button>
              <button
                className="btn"
                style={{ flex: 1, height: 52, borderRadius: 8, background: 'var(--lav)', boxShadow: '3px 3px 0 var(--ink)', font: '400 17px var(--font-dot)', color: 'var(--on-color)' }}
                onClick={() => { setSkipOpen(false); onRest(); }}
              >
                おやすみ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
