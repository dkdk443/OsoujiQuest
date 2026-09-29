import type { ReactNode } from 'react';
import type { Voice } from '../../shared/types';
import { Chiribo } from '../components/Chiribo';
import type { Settings as SettingsData } from '../lib/db';

type Props = {
  settings: SettingsData;
  onChange: (s: SettingsData) => void;
  onExport: () => void;
  onBack: () => void;
};

// 表示は月曜はじまり。値は Date#getDay と同じ 0=日 … 6=土
const WEEK = [['月', 1], ['火', 2], ['水', 3], ['木', 4], ['金', 5], ['土', 6], ['日', 0]] as const;
const COUNTS = [1, 3, 5, 10] as const;
const VOICES: Voice[] = ['ふんわり', 'げんき'];
const KEEPS = [[7, '7日'], [30, '30日'], [null, 'ずっと']] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ font: '400 12px var(--font-dot)', color: 'var(--sub)', letterSpacing: '.06em' }}>{title}</div>
      <div style={{ border: '2.5px solid var(--ink)', borderRadius: 12, background: 'var(--paper)', boxShadow: '3px 3px 0 var(--ink)', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, note, first, children }: { label: string; note?: string; first?: boolean; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, borderTop: first ? 0 : '2px solid var(--bg)' }}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
      {children}
      {note && <div style={{ fontSize: 12, color: 'var(--sub)' }}>{note}</div>}
    </div>
  );
}

export function Settings({ settings: s, onChange, onExport, onBack }: Props) {
  const set = (patch: Partial<SettingsData>) => onChange({ ...s, ...patch });
  const toggleRest = (d: number) =>
    set({ restWeekdays: s.restWeekdays.includes(d) ? s.restWeekdays.filter(x => x !== d) : [...s.restWeekdays, d] });
  const restNames = WEEK.filter(([, d]) => s.restWeekdays.includes(d)).map(([n]) => n);

  return (
    <div className="screen" style={{ gap: 18, backgroundImage: 'none' }}>
      <div>
        <button className="back" onClick={onBack}>← きろく</button>
      </div>
      <div style={{ fontFamily: 'var(--font-dot)', fontSize: 26 }}>せってい</div>

      <Section title="まいにち">
        <Row
          first
          label="おやすみの曜日"
          note={restNames.length ? `${restNames.join('・')}は何もしなくても連続記録がつづくよ` : 'おやすみの曜日なし'}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {WEEK.map(([name, d]) => {
              const on = s.restWeekdays.includes(d);
              return (
                <button
                  key={d}
                  aria-pressed={on}
                  onClick={() => toggleRest(d)}
                  style={{
                    height: 38, padding: 0, border: '2.5px solid var(--ink)', borderRadius: 6,
                    background: on ? 'var(--lav)' : 'var(--paper)', color: on ? 'var(--on-color)' : 'var(--text)',
                    font: '400 14px var(--font-dot)',
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </Row>
        <Row label="1回のミッション数" note="写真1枚からチリボが出すタスクの数">
          <div className="seg">
            {COUNTS.map(n => (
              <button key={n} aria-pressed={s.missionCount === n} onClick={() => set({ missionCount: n })}>{n}こ</button>
            ))}
          </div>
        </Row>
      </Section>

      <Section title="チリボ">
        <Row first label="しゃべりかた">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 54, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Chiribo size={44} mood={s.voice === 'げんき' ? 'happy' : 'normal'} />
            </div>
            <div className="seg" style={{ flex: 1 }}>
              {VOICES.map(v => (
                <button key={v} aria-pressed={s.voice === v} onClick={() => set({ voice: v })}>{v}</button>
              ))}
            </div>
          </div>
        </Row>
      </Section>

      <Section title="写真とデータ">
        <Row first label="写真の保存期間" note="過ぎた写真は自動で消えるよ。何個片づけたかの記録は残る">
          <div className="seg">
            {KEEPS.map(([days, name]) => (
              <button key={name} aria-pressed={s.photoKeepDays === days} onClick={() => set({ photoKeepDays: days })}>{name}</button>
            ))}
          </div>
        </Row>
        <Row label="エクスポート" note="記録と設定をJSONで書き出す（写真は入らない）。サイトデータを消すと記録も消えるので、ときどき保存しておくと安心">
          <button className="btn" style={{ height: 44, borderRadius: 8, font: '400 15px var(--font-dot)' }} onClick={onExport}>
            JSONを書き出す
          </button>
        </Row>
      </Section>

      <div style={{ fontSize: 11, color: 'var(--sub)', textAlign: 'center', lineHeight: 1.7 }}>
        写真はこの端末だけに保存。解析のときだけ縮小して送り、サーバーには残さない
      </div>
    </div>
  );
}
