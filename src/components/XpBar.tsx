import { XP_PER_LEVEL } from '../lib/game';

type Props = { label: string; xp: number };

export function XpBar({ label, xp }: Props) {
  return (
    <div className="xpbar">
      <div>{label}</div>
      <div className="xpbar-track">
        <div className="xpbar-fill" style={{ width: `${(xp / XP_PER_LEVEL) * 100}%` }} />
      </div>
      <div>{xp}/{XP_PER_LEVEL}</div>
    </div>
  );
}
