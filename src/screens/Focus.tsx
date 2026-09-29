import { useEffect, useState } from 'react';
import type { Task, Voice } from '../../shared/types';
import { Chiribo } from '../components/Chiribo';
import { line } from '../lib/lines';

type Props = {
  task: Task;
  index: number; // 1始まり
  total: number;
  voice: Voice;
  onFinish: () => void;
  onPass: () => void;
  onQuit: () => void;
};

const LIMIT = 60;

// 60秒リング。0秒になっても終わらせず「時間切れでもいいよ」と出すだけ
export function Focus({ task, index, total, voice, onFinish, onPass, onQuit }: Props) {
  // 画面が消灯しても正しく減るよう、開始時刻からの経過で数える
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const sec = Math.max(0, LIMIT - Math.floor((now - startedAt) / 1000));
  const pct = Math.round((1 - sec / LIMIT) * 100);

  return (
    <div className="screen" style={{ background: 'var(--bg-focus)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="back" onClick={onQuit}>× やめる</button>
        <div style={{ font: '400 13px var(--font-dot)', color: 'var(--sub)' }}>タスク {index} / {total}</div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 26, padding: '20px 0' }}>
        <div
          role="timer"
          aria-label={`のこり${sec}秒`}
          style={{
            width: 220, height: 220, borderRadius: '50%', border: '3px solid var(--ink)', boxShadow: '4px 4px 0 var(--ink)',
            background: `conic-gradient(var(--pink) 0 ${pct}%, rgba(128,128,128,.25) ${pct}% 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{
            width: 176, height: 176, borderRadius: '50%', border: '3px solid var(--ink)', background: 'var(--paper)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            <div style={{ font: '400 44px var(--font-dot)', letterSpacing: '.02em' }}>{Math.floor(sec / 60)}:{String(sec % 60).padStart(2, '0')}</div>
            <div style={{ fontSize: 11, color: 'var(--sub)' }}>{sec === 0 ? '時間切れでもいいよ' : 'ゆっくりでいい'}</div>
          </div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.5, textAlign: 'center', maxWidth: 320, textWrap: 'pretty' }}>{task.text}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 56, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Chiribo mood="side" size={50} />
          </div>
          <div style={{ padding: '9px 12px', border: '2.5px solid var(--ink)', borderRadius: 8, background: 'var(--paper)', fontSize: 13, lineHeight: 1.5, maxWidth: 230 }}>
            {line('focus', voice)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn" style={{ width: 110, height: 60 }} onClick={onPass}>パス</button>
        <button className="btn btn-primary" style={{ flex: 1, height: 60 }} onClick={onFinish}>できた！</button>
      </div>
    </div>
  );
}
