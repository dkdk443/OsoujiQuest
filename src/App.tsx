import { useCallback, useEffect, useState } from 'react';
import type { Profile, Task, Voice } from '../shared/types';
import { gainXp, xpFor } from './lib/game';
import { resizePhoto, type Photo } from './lib/image';
import { analyzePhoto, type Quest } from './lib/tasks';
import { Camera } from './screens/Camera';
import { Done } from './screens/Done';
import { Focus } from './screens/Focus';
import { Home } from './screens/Home';
import { Scan } from './screens/Scan';
import { Tasks } from './screens/Tasks';

// ルーターは使わず、プロトタイプと同じく screen 状態で画面を切り替える。
// ステップ4以降で 'compare' | 'history' | 'settings' を足す
type Screen = 'home' | 'cam' | 'scan' | 'tasks' | 'focus' | 'done';

// ステップ5で設定画面の「1日のミッション数」に置き換える
const MISSION_COUNT = 5;

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  // ステップ4で Dexie（IndexedDB）に保存するまでは、メモリ上だけで持つ
  const [profile, setProfile] = useState<Profile>({ xp: 0, level: 1, streak: 0, lastCountedDay: null });
  const [voice] = useState<Voice>('ふんわり');
  const [oneMode, setOneMode] = useState(true);
  const [restToday, setRestToday] = useState(false);

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [quest, setQuest] = useState<Quest | null>(null);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [lastGain, setLastGain] = useState({ gained: 0, leveled: false });

  // 写真を差し替えたら古い object URL を解放する
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);

  const onPick = async (file: File) => {
    let p: Photo;
    try {
      p = await resizePhoto(file);
    } catch {
      alert('写真を読みこめなかったよ。もう一回撮ってみて');
      return;
    }
    setPhoto(p);
    setPhotoUrl(URL.createObjectURL(p.blob));
    setQuest(null);
    setDoneIds([]);
    setScreen('scan');
    setQuest(await analyzePhoto(p.blob, MISSION_COUNT, voice));
  };

  const toTasks = useCallback(() => {
    setShowAll(!oneMode);
    setScreen('tasks');
  }, [oneMode]);

  const tasks = quest?.tasks ?? [];
  const focusTask = tasks.find(t => t.id === focusId) ?? null;

  // 今のタスクの次から順にさがし、まだできていないものを返す（パスで同じ2つを行き来しないように）
  const nextAfter = (id: string | null): Task | undefined => {
    const start = tasks.findIndex(t => t.id === id);
    return [...tasks.slice(start + 1), ...tasks.slice(0, start + 1)].find(t => t.id !== id && !doneIds.includes(t.id));
  };

  const startFocus = (t: Task) => {
    setFocusId(t.id);
    setScreen('focus');
  };

  const finishFocus = () => {
    if (!focusTask || doneIds.includes(focusTask.id)) return;
    const gained = xpFor(focusTask);
    const { profile: next, leveled } = gainXp(profile, gained);
    setProfile(next);
    setDoneIds(ids => [...ids, focusTask.id]);
    setLastGain({ gained, leveled });
    setScreen('done');
  };

  const pass = () => {
    const n = nextAfter(focusId);
    if (n) startFocus(n);
    else setScreen('tasks');
  };

  switch (screen) {
    case 'home':
      return (
        <Home
          profile={profile}
          voice={voice}
          restToday={restToday}
          oneMode={oneMode}
          onToggleOneMode={() => setOneMode(v => !v)}
          onShoot={() => setScreen('cam')}
          onRest={() => setRestToday(true)}
        />
      );
    case 'cam':
      return <Camera voice={voice} onPick={onPick} onCancel={() => setScreen('home')} />;
    case 'scan':
      return <Scan photoUrl={photoUrl!} done={quest !== null} onFinish={toTasks} />;
    case 'tasks':
      return (
        <Tasks
          quest={quest!}
          photo={photo!}
          photoUrl={photoUrl!}
          voice={voice}
          doneIds={doneIds}
          showAll={showAll}
          onShowAll={setShowAll}
          onStart={startFocus}
          onHome={() => setScreen('home')}
        />
      );
    case 'focus':
      return (
        <Focus
          key={focusTask!.id}
          task={focusTask!}
          index={tasks.indexOf(focusTask!) + 1}
          total={tasks.length}
          voice={voice}
          onFinish={finishFocus}
          onPass={pass}
          onQuit={() => setScreen('tasks')}
        />
      );
    case 'done': {
      const n = nextAfter(focusId);
      return (
        <Done
          profile={profile}
          gained={lastGain.gained}
          leveled={lastGain.leveled}
          hasNext={!!n}
          voice={voice}
          onOneMore={() => n && startFocus(n)}
          onHome={() => setScreen('home')}
        />
      );
    }
  }
}
