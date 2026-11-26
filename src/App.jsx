import { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import Flow from './pages/Flow.jsx';
import Viewer from './pages/Viewer.jsx';
import Couple from './pages/Couple.jsx';
import { Toasts } from './components/ui.jsx';
import SignIn from './pages/SignIn.jsx';
import { useAuth } from './auth.js';
import { loadByOwnerToken, loadMine, loadProject } from './store.js';

function parse(hash) {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'new') return { page: 'flow', id: null, step: 'details' };
  if (parts[0] === 'p' && parts[1]) return { page: 'flow', id: parts[1], step: parts[2] || 'customize' };
  if (parts[0] === 'i' && parts[1]) return { page: 'viewer', id: parts[1], guestId: parts[2] || null };
  if (parts[0] === 'c' && parts[1]) return { page: 'couple', token: parts[1] };
  return { page: 'dashboard' };
}

/** Fetch whatever the current route needs before it renders. */
function prepare(route) {
  if (route.page === 'dashboard') return loadMine();
  if (route.page === 'flow') return Promise.all([loadMine(), route.id ? loadProject(route.id) : null]);
  if (route.page === 'viewer') return loadProject(route.id);
  if (route.page === 'couple') return loadByOwnerToken(route.token);
  return Promise.resolve();
}

export default function App() {
  const [route, setRoute] = useState(() => parse(location.hash));
  const auth = useAuth();
  const designerPage = route.page === 'dashboard' || route.page === 'flow';
  const needsSignIn = designerPage && auth.status === 'out';
  const [load, setLoad] = useState({ key: '', state: 'loading' });
  const key = `${route.page}/${route.id || route.token || ''}/${auth.user ? auth.user.uid : ''}`;
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let dead = false;
    if (auth.status === 'loading' || needsSignIn) return undefined;
    setLoad({ key, state: 'loading' });
    prepare(route)
      .then(() => !dead && setLoad({ key, state: 'ready' }))
      .catch(() => !dead && setLoad({ key, state: 'error' }));
    return () => {
      dead = true;
    };
  }, [key, attempt, auth.status]); // eslint-disable-line react-hooks/exhaustive-deps
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

  if (needsSignIn) return <SignIn />;
  if (auth.status === 'loading' || load.key !== key || load.state === 'loading') {
    return (
      <main className="viewer-missing" aria-busy="true">
        <p className="eyebrow">Everafter Studio</p>
        <p>Loading…</p>
      </main>
    );
  }
  if (load.state === 'error') {
    return (
      <main className="viewer-missing">
        <p className="eyebrow">Everafter Studio</p>
        <h1>Couldn’t load</h1>
        <p>Check your internet connection and try again.</p>
        <button type="button" className="btn btn-primary" onClick={() => setAttempt((n) => n + 1)}>
          Try again
        </button>
      </main>
    );
  }

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
