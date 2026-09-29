import Dexie, { type EntityTable } from 'dexie';
import type { Profile, Session, Voice } from '../../shared/types';

// すべて端末の IndexedDB に保存し、サーバーには何も残さない

export type Settings = {
  restWeekdays: number[]; // 0=日 … 6=土
  missionCount: number; // 1〜MAX_TASKS
  voice: Voice;
  photoKeepDays: 7 | 30 | null; // null = ずっと
};

export type PhotoRecord = { id: number; blob: Blob; createdAt: number };

// profile と settings はキー 'me' の1件だけ
type Singleton<T> = T & { key: 'me' };

export const db = new Dexie('osouji-quest') as Dexie & {
  profile: EntityTable<Singleton<Profile>, 'key'>;
  settings: EntityTable<Singleton<Settings>, 'key'>;
  sessions: EntityTable<Session & { id: number }, 'id'>;
  // 写真は sessions と分け、期限で写真だけ消しても記録は残るようにする
  photos: EntityTable<PhotoRecord, 'id'>;
};

db.version(1).stores({
  profile: 'key',
  settings: 'key',
  sessions: '++id, day',
  photos: '++id, createdAt',
});

export const DEFAULT_PROFILE: Profile = { xp: 0, level: 1, streak: 0, lastCountedDay: null };
export const DEFAULT_SETTINGS: Settings = { restWeekdays: [6], missionCount: 5, voice: 'ふんわり', photoKeepDays: 30 };

export async function loadProfile(): Promise<Profile> {
  const row = await db.profile.get('me');
  if (!row) return DEFAULT_PROFILE;
  const { key: _key, ...p } = row;
  return p;
}

export async function loadSettings(): Promise<Settings> {
  const row = await db.settings.get('me');
  if (!row) return DEFAULT_SETTINGS;
  const { key: _key, ...s } = row;
  return { ...DEFAULT_SETTINGS, ...s };
}

export const saveProfile = (p: Profile) => db.profile.put({ ...p, key: 'me' });

export const saveSettings = (s: Settings) => db.settings.put({ ...s, key: 'me' });

export const addPhoto = (blob: Blob) => db.photos.add({ blob, createdAt: Date.now() });

const DAY_MS = 24 * 60 * 60 * 1000;

// 保存期間を過ぎた写真を消し、sessions からの参照も外す。記録（何個片づけたか）は残る
export async function purgeOldPhotos(keepDays: Settings['photoKeepDays'], now = Date.now()): Promise<number> {
  if (keepDays === null) return 0;
  const cutoff = now - keepDays * DAY_MS;
  return db.transaction('rw', db.photos, db.sessions, async () => {
    const ids = (await db.photos.where('createdAt').below(cutoff).primaryKeys()) as number[];
    if (ids.length === 0) return 0;
    await db.sessions.filter(s => ids.includes(s.beforePhotoId ?? -1)).modify(s => { delete s.beforePhotoId; });
    await db.sessions.filter(s => ids.includes(s.afterPhotoId ?? -1)).modify(s => { delete s.afterPhotoId; });
    await db.photos.bulkDelete(ids);
    return ids.length;
  });
}

// 手動バックアップ用。写真は含めない
export async function exportData() {
  const [profile, settings, sessions] = await Promise.all([loadProfile(), loadSettings(), db.sessions.orderBy('day').toArray()]);
  return {
    app: 'osouji-quest',
    version: 1,
    exportedAt: new Date().toISOString(),
    profile,
    settings,
    sessions: sessions.map(({ beforePhotoId: _b, afterPhotoId: _a, ...s }) => s),
  };
}
