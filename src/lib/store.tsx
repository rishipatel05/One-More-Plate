import { createContext, useContext, useState, type ReactNode } from 'react';
import type { FoodPost, DeliveryRun, UserAccount, CommunityStats } from '../types';
import { SEED_POSTS, MOCK_ACTIVE_RUN, MOCK_USER, COMMUNITY_STATS } from '../data/seed';

type Tab = 'post' | 'feed' | 'deliver' | 'volunteer' | 'account';

interface AppState {
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
  posts: FoodPost[];
  addPost: (p: FoodPost) => void;
  claimPost: (id: string) => void;
  activeRun: DeliveryRun | null;
  setActiveRun: (r: DeliveryRun | null) => void;
  user: UserAccount;
  setUser: (u: UserAccount) => void;
  stats: CommunityStats;
  updateStats: (delta: Partial<CommunityStats>) => void;
  toast: string;
  showToast: (msg: string) => void;
  isVolunteer: boolean;
  setIsVolunteer: (v: boolean) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<Tab>('post');
  const [posts, setPosts] = useState<FoodPost[]>(SEED_POSTS);
  const [activeRun, setActiveRun] = useState<DeliveryRun | null>(MOCK_ACTIVE_RUN);
  const [user, setUser] = useState<UserAccount>(MOCK_USER);
  const [stats, setStats] = useState<CommunityStats>(COMMUNITY_STATS);
  const [toast, setToast] = useState('');
  const [isVolunteer, setIsVolunteer] = useState(true);

  const addPost = (p: FoodPost) => setPosts(prev => [p, ...prev]);

  const claimPost = (id: string) =>
    setPosts(prev => prev.map(p => p.id === id ? { ...p, claimed: true, claimedBy: user.firstName } : p));

  const updateStats = (delta: Partial<CommunityStats>) =>
    setStats(prev => ({ ...prev, ...Object.fromEntries(Object.entries(delta).map(([k, v]) => [k, (prev[k as keyof CommunityStats] as number) + (v as number)])) }));

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };

  return (
    <AppContext.Provider value={{ activeTab, setActiveTab, posts, addPost, claimPost, activeRun, setActiveRun, user, setUser, stats, updateStats, toast, showToast, isVolunteer, setIsVolunteer }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
