type Props = {
  current: 'home' | 'history';
  onHome: () => void;
  onShoot: () => void;
  onHistory: () => void;
};

// ホームときろくの下に出るタブ。高さぶん画面側で下に余白（TAB_SPACE）を取る
export const TAB_SPACE = 'calc(env(safe-area-inset-bottom) + 116px)';

export function TabBar({ current, onHome, onShoot, onHistory }: Props) {
  const tab = (key: Props['current'], label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      aria-current={current === key ? 'page' : undefined}
      style={{
        width: 90, height: 54, border: 0, background: 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
      }}
    >
      <span style={{ width: 14, height: 14, border: '2.5px solid var(--ink)', background: current === key ? 'var(--pink)' : 'var(--paper)' }} />
      <span style={{ font: '400 11px var(--font-dot)' }}>{label}</span>
    </button>
  );

  return (
    <nav style={{
      position: 'fixed', zIndex: 5, bottom: 'calc(env(safe-area-inset-bottom) + 20px)',
      left: '50%', transform: 'translateX(-50%)', width: 'calc(min(100%, 480px) - 28px)', height: 64,
      border: '2.5px solid var(--ink)', borderRadius: 14, background: 'var(--paper)', boxShadow: '3px 3px 0 var(--ink)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
    }}>
      {tab('home', 'ホーム', onHome)}
      <button
        onClick={onShoot}
        style={{
          width: 58, height: 58, marginTop: -26, border: '2.5px solid var(--ink)', borderRadius: '50%',
          background: 'var(--pink)', boxShadow: '3px 3px 0 var(--ink)', font: '400 12px var(--font-dot)', color: 'var(--on-color)',
        }}
      >
        撮る
      </button>
      {tab('history', 'きろく', onHistory)}
    </nav>
  );
}
