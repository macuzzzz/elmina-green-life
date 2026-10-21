import { useEffect } from 'react';
import { api, type Collection } from '@/services/api';
import { useStore, type DataSlice } from '@/store';
import { LoginScreen } from '@/ui/LoginScreen';
import { GameScreen } from './GameScreen';

type Key = Exclude<Collection, 'all'>;

const LOADERS: Record<Key, () => Promise<DataSlice[Key]>> = {
  users: api.listUsers,
  posts: api.listPosts,
  announcements: api.listAnnouncements,
  incidents: api.listIncidents,
  repairs: api.listRepairs,
  suggestions: api.listSuggestions,
  channels: api.listChannels,
  messages: api.listMessages,
  notifications: api.listNotifications,
};

async function load(keys: Key[]) {
  const values = await Promise.all(keys.map((k) => LOADERS[k]()));
  useStore.getState().setData(Object.fromEntries(keys.map((k, i) => [k, values[i]])) as Partial<DataSlice>);
}

export function App() {
  const session = useStore((s) => s.session);
  const loaded = useStore((s) => s.sessionLoaded);

  useEffect(() => {
    const all = Object.keys(LOADERS) as Key[];
    const loadSession = () => api.getSession().then(useStore.getState().setSession);
    void Promise.all([load(all), loadSession()]).then(() =>
      useStore.getState().setData({ dataLoaded: true }),
    );
    // Changes from this tab or any other open tab (BroadcastChannel) stream in here.
    return api.subscribe((e) => {
      if (e.type === 'session-changed') void loadSession();
      else void load(e.collection === 'all' ? all : [e.collection]);
    });
  }, []);

  // Staff tabs announce themselves so residents get live replies instead of auto-replies.
  useEffect(() => {
    if (!session || session.role === 'resident') return;
    api.heartbeat(session.role);
    const id = setInterval(() => api.heartbeat(session.role), 4000);
    return () => clearInterval(id);
  }, [session]);

  if (!loaded) {
    return (
      <div className="grid h-full place-items-center bg-gradient-to-b from-sky-200 to-leaf-100">
        <img src="/brand/logo.svg" alt="Elmina Green" className="h-16 animate-pulse" />
      </div>
    );
  }
  if (!session) return <LoginScreen />;
  return <GameScreen key={session.userId} role={session.role} />;
}
