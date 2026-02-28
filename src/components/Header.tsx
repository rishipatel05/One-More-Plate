import { useApp } from '../lib/store';

type Tab = 'post' | 'feed' | 'deliver' | 'volunteer' | 'account';

const TABS: { id: Tab; label: string }[] = [
  { id: 'post', label: 'Post' },
  { id: 'feed', label: 'Available' },
  { id: 'deliver', label: 'Delivery' },
  { id: 'volunteer', label: 'Volunteer' },
  { id: 'account', label: 'Account' },
];

export default function Header() {
  const { activeTab, setActiveTab } = useApp();

  return (
    <div className="header">
      <div className="header-top">
        <div>
          <div className="wordmark-main">
            One More<span>.</span>
            <br />
            Plate<span>.</span>
          </div>
          <div className="wordmark-sub">Food Rescue · Newark, DE</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div className="live-pill">
            <div className="live-dot" />
            Live
          </div>
          <div style={{ fontSize: 10, color: 'var(--warm-grey)' }}>Newark · 19711</div>
        </div>
      </div>
      <div className="tabs">
        {TABS.map(t => (
          <div
            key={t.id}
            className={`tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </div>
        ))}
      </div>
    </div>
  );
}
