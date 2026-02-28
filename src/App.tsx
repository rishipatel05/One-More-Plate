import { useApp } from './lib/store';
import Header from './components/Header';
import PostTab from './components/PostTab';
import FeedTab from './components/FeedTab';
import DeliverTab from './components/DeliverTab';
import VolunteerTab from './components/VolunteerTab';
import AccountTab from './components/AccountTab';

function Toast() {
  const { toast } = useApp();
  return (
    <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
  );
}

export default function App() {
  const { activeTab } = useApp();

  return (
    <div className="app">
      <Header />
      <div className="screen-content">
        {activeTab === 'post' && <PostTab />}
        {activeTab === 'feed' && <FeedTab />}
        {activeTab === 'deliver' && <DeliverTab />}
        {activeTab === 'volunteer' && <VolunteerTab />}
        {activeTab === 'account' && <AccountTab />}
      </div>
      <Toast />
    </div>
  );
}
