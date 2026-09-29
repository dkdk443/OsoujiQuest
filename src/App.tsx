import { useState } from 'react';
import type { Profile, Voice } from '../shared/types';
import { Home } from './screens/Home';

// ルーターは使わず、プロトタイプと同じく screen 状態で画面を切り替える。
// ステップ2以降で 'cam' | 'scan' | 'tasks' | 'focus' | 'done' | 'compare' | 'history' | 'settings' を足す
type Screen = 'home';

export default function App() {
  const [screen] = useState<Screen>('home');
  // ステップ4で Dexie（IndexedDB）に保存するまでは、メモリ上だけで持つ
  const [profile] = useState<Profile>({ xp: 0, level: 1, streak: 0, lastCountedDay: null });
  const [voice] = useState<Voice>('ふんわり');
  const [oneMode, setOneMode] = useState(true);
  const [restToday, setRestToday] = useState(false);

  switch (screen) {
    case 'home':
      return (
        <Home
          profile={profile}
          voice={voice}
          restToday={restToday}
          oneMode={oneMode}
          onToggleOneMode={() => setOneMode(v => !v)}
          onShoot={() => alert('カメラはステップ2でつくるよ')}
          onRest={() => setRestToday(true)}
        />
      );
  }
}
