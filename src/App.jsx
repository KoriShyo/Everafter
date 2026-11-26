import { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import Flow from './pages/Flow.jsx';
import Viewer from './pages/Viewer.jsx';
import Couple from './pages/Couple.jsx';
import { Toasts } from './components/ui.jsx';

function parse(hash) {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'new') return { page: 'flow', id: null, step: 'details' };
  if (parts[0] === 'p' && parts[1]) return { page: 'flow', id: parts[1], step: parts[2] || 'customize' };
  if (parts[0] === 'i' && parts[1]) return { page: 'viewer', id: parts[1], guestId: parts[2] || null };
  if (parts[0] === 'c' && parts[1]) return { page: 'couple', token: parts[1] };
  return { page: 'dashboard' };
}

export default function App() {
  const [route, setRoute] = useState(() => parse(location.hash));
  useEffect(() => {
    const on = () => {
      setRoute(parse(location.hash));
      window.scrollTo(0, 0);
    };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  useEffect(() => {
    document.body.dataset.page = route.page;
  }, [route.page]);

  return (
    <>
      {route.page === 'dashboard' && <Dashboard />}
      {route.page === 'flow' && <Flow id={route.id} step={route.step} />}
      {route.page === 'viewer' && <Viewer id={route.id} guestId={route.guestId} />}
      {route.page === 'couple' && <Couple token={route.token} />}
      <Toasts />
    </>
  );
}
