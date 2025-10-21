import { useEffect, useMemo, useState } from 'react';
import WelcomeScreen from './screens/WelcomeScreen';
import TypingScreen from './screens/TypingScreen';
import ProgressScreen from './screens/ProgressScreen';
import { getResults } from './store';

type Route = 'welcome' | 'typing' | 'progress';

export default function App() {
  const [route, setRoute] = useState<Route>('welcome');
  const [lastResultId, setLastResultId] = useState<string | null>(null);

  // Simple hash-based navigation (no external router)
  useEffect(() => {
    const go = () => {
      const r = (location.hash.replace('#', '') as Route) || 'welcome';
      setRoute(r);
    };
    window.addEventListener('hashchange', go);
    go();
    return () => window.removeEventListener('hashchange', go);
  }, []);

  const results = useMemo(() => getResults(), [route]);

  return (
    <div className="app">
      {route === 'welcome' && (
        <WelcomeScreen
          onStart={() => {
            location.hash = 'typing';
          }}
          onProgress={() => (location.hash = 'progress')}
        />
      )}
      {route === 'typing' && (
        <TypingScreen
          onFinish={(id) => {
            setLastResultId(id);
            location.hash = 'progress';
          }}
          onCancel={() => (location.hash = 'welcome')}
        />
      )}
      {route === 'progress' && (
        <ProgressScreen
          lastResultId={lastResultId}
          results={results}
          onStart={() => (location.hash = 'typing')}
          onHome={() => (location.hash = 'welcome')}
        />
      )}
    </div>
  );
}

