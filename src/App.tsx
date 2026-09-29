import { useCallback, useEffect, useRef, useState } from 'react';
import type { Profile, Task } from '../shared/types';
import { TabBar } from './components/TabBar';
import {
  addPhoto, db, DEFAULT_PROFILE, DEFAULT_SETTINGS, exportData, loadProfile, loadSettings, purgeOldPhotos, saveProfile, saveSettings,
  type Settings,
} from './lib/db';
import { catchUp, countToday, gainXp, logicalDay, xpFor } from './lib/game';
import { resizePhoto, type Photo } from './lib/image';
import { analyzePhoto, type Quest } from './lib/tasks';
import { Camera } from './screens/Camera';
import { Compare } from './screens/Compare';
import { Done } from './screens/Done';
import { Focus } from './screens/Focus';
import { History } from './screens/History';
import { Home } from './screens/Home';
import { Scan } from './screens/Scan';
import { Settings as SettingsScreen } from './screens/Settings';
import { Tasks } from './screens/Tasks';

// ルーターは使わず、プロトタイプと同じく screen 状態で画面を切り替える
type Screen = 'home' | 'cam' | 'scan' | 'tasks' | 'focus' | 'done' | 'compare' | 'history' | 'settings';

const logError = (what: string) => (err: unknown) => console.error(what, err);

export default function App() {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>('home');
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [today, setToday] = useState(() => logicalDay());
  const [restToday, setRestToday] = useState(false);
  const [oneMode, setOneMode] = useState(true);
  const [camMode, setCamMode] = useState<'before' | 'after'>('before');

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);
  const afterPhotoId = useRef<number | null>(null);
  const [quest, setQuest] = useState<Quest | null>(null);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [lastGain, setLastGain] = useState({ gained: 0, leveled: false });
  // 今の写真のセッション。最初の1個を完了したときに写真と一緒に保存し、以降は更新する
  const sessionId = useRef<Promise<number> | null>(null);

  const profileRef = useRef(profile);
  const commitProfile = useCallback((p: Profile) => {
    profileRef.current = p;
    setProfile(p);
    saveProfile(p).catch(logError('save profile failed'));
  }, []);

  // 起動時とアプリに戻ってきたとき：論理日を更新し、空いた日の連続記録を判定する
  const refreshDay = useCallback(async (s: Settings) => {
    const d = logicalDay();
    const p = profileRef.current;
    const caught = catchUp(p, s.restWeekdays, d);
    if (caught.streak !== p.streak || caught.lastCountedDay !== p.lastCountedDay) commitProfile(caught);
    const rests = await db.sessions.where('day').equals(d).filter(x => x.kind === 'rest').count();
    setRestToday(rests > 0);
    setToday(d);
    await purgeOldPhotos(s.photoKeepDays);
  }, [commitProfile]);

  useEffect(() => {
    (async () => {
      // ブラウザにサイトデータを消されにくくする
      navigator.storage?.persist?.().catch(() => {});
      const [p, s] = await Promise.all([loadProfile(), loadSettings()]);
      profileRef.current = p;
      setProfile(p);
      setSettings(s);
      await refreshDay(s);
    })()
      .catch(logError('load failed'))
      .finally(() => setReady(true));
  }, [refreshDay]);

  useEffect(() => {
    if (!ready) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshDay(settings).catch(logError('refresh failed'));
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [ready, settings, refreshDay]);

  // 写真を差し替えたら古い object URL を解放する
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);
  useEffect(() => () => { if (afterUrl) URL.revokeObjectURL(afterUrl); }, [afterUrl]);

  const onPick = async (file: File) => {
    if (camMode === 'after') return onPickAfter(file);
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
    setAfterUrl(null);
    sessionId.current = null;
    afterPhotoId.current = null;
    setScreen('scan');
    setQuest(await analyzePhoto(p.blob, settings.missionCount, settings.voice));
  };

  // アフター写真は解析せず、端末に保存して比較にだけ使う
  const onPickAfter = async (file: File) => {
    let p: Photo;
    try {
      p = await resizePhoto(file);
    } catch {
      alert('写真を読みこめなかったよ。もう一回撮ってみて');
      return;
    }
    setAfterUrl(URL.createObjectURL(p.blob));
    setScreen('compare');
    const prev = afterPhotoId.current;
    const id = await addPhoto(p.blob);
    afterPhotoId.current = id;
    // 撮り直したら前のアフター写真は消す
    if (prev !== null) db.photos.delete(prev).catch(logError('delete old after failed'));
    sessionId.current?.then(sid => db.sessions.update(sid, { afterPhotoId: id })).catch(logError('save after failed'));
  };

  const openCam = (mode: 'before' | 'after') => {
    setCamMode(mode);
    setScreen('cam');
  };

  const goHome = () => {
    setScreen('home');
    purgeOldPhotos(settings.photoKeepDays).catch(logError('purge failed'));
  };

  const changeSettings = (s: Settings) => {
    setSettings(s);
    saveSettings(s).catch(logError('save settings failed'));
  };

  const download = async () => {
    const data = await exportData();
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `osouji-quest-${logicalDay()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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

  const saveSession = (day: string, done: string[]) => {
    const gainedXp = tasks.filter(t => done.includes(t.id)).reduce((sum, t) => sum + xpFor(t), 0);
    if (!sessionId.current) {
      const blob = photo!.blob;
      sessionId.current = (async () => {
        const beforePhotoId = await addPhoto(blob);
        return db.sessions.add({ day, kind: 'clear', tasks, doneIds: done, gainedXp, beforePhotoId });
      })();
    } else {
      sessionId.current = sessionId.current.then(async id => {
        await db.sessions.update(id, { doneIds: done, gainedXp });
        return id;
      });
    }
    sessionId.current.catch(logError('save session failed'));
  };

  const finishFocus = () => {
    if (!focusTask || doneIds.includes(focusTask.id)) return;
    const d = logicalDay();
    const gained = xpFor(focusTask);
    const { profile: leveledUp, leveled } = gainXp(profile, gained);
    commitProfile(countToday(leveledUp, d));
    const done = [...doneIds, focusTask.id];
    setDoneIds(done);
    saveSession(d, done);
    setToday(d);
    setLastGain({ gained, leveled });
    setScreen('done');
  };

  const rest = () => {
    const d = logicalDay();
    commitProfile(countToday(profile, d));
    db.sessions.add({ day: d, kind: 'rest', tasks: [], doneIds: [], gainedXp: 0 }).catch(logError('save rest failed'));
    setRestToday(true);
    setToday(d);
  };

  const pass = () => {
    const n = nextAfter(focusId);
    if (n) startFocus(n);
    else setScreen('tasks');
  };

  if (!ready) return null;

  const tabBar = (current: 'home' | 'history') => (
    <TabBar current={current} onHome={goHome} onShoot={() => openCam('before')} onHistory={() => setScreen('history')} />
  );

  switch (screen) {
    case 'home':
      return (
        <>
          <Home
            profile={profile}
            voice={settings.voice}
            restToday={restToday}
            canSkip={profile.lastCountedDay !== today}
            oneMode={oneMode}
            onToggleOneMode={() => setOneMode(v => !v)}
            onShoot={() => openCam('before')}
            onRest={rest}
          />
          {tabBar('home')}
        </>
      );
    case 'history':
      return (
        <>
          <History
            profile={profile}
            restWeekdays={settings.restWeekdays}
            today={today}
            voice={settings.voice}
            onSettings={() => setScreen('settings')}
          />
          {tabBar('history')}
        </>
      );
    case 'cam':
      return (
        <Camera
          mode={camMode}
          voice={settings.voice}
          onPick={onPick}
          onCancel={() => (camMode === 'after' ? setScreen('done') : goHome())}
        />
      );
    case 'scan':
      return <Scan photoUrl={photoUrl!} done={quest !== null} onFinish={toTasks} />;
    case 'tasks':
      return (
        <Tasks
          quest={quest!}
          photo={photo!}
          photoUrl={photoUrl!}
          voice={settings.voice}
          doneIds={doneIds}
          showAll={showAll}
          onShowAll={setShowAll}
          onStart={startFocus}
          onHome={goHome}
        />
      );
    case 'focus':
      return (
        <Focus
          key={focusTask!.id}
          task={focusTask!}
          index={tasks.indexOf(focusTask!) + 1}
          total={tasks.length}
          voice={settings.voice}
          photoUrl={photoUrl!}
          pinned={quest!.pinned}
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
          voice={settings.voice}
          onAfter={() => openCam('after')}
          onOneMore={() => n && startFocus(n)}
          onHome={goHome}
        />
      );
    }
    case 'compare':
      return (
        <Compare
          beforeUrl={photoUrl!}
          afterUrl={afterUrl!}
          doneCount={doneIds.length}
          voice={settings.voice}
          onHome={goHome}
          onHistory={() => setScreen('history')}
        />
      );
    case 'settings':
      return <SettingsScreen settings={settings} onChange={changeSettings} onExport={download} onBack={() => setScreen('history')} />;
  }
}
