import { StrictMode, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { Home } from './app/home';
import { CantoneseGuide } from './app/cantoneseGuide';
import './styles.css';

function subscribeHash(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

function getHash(): string {
  return window.location.hash;
}

function Router() {
  const hash = useSyncExternalStore(subscribeHash, getHash, () => '');
  if (hash === '#/cantonese-games' || hash === '#cantonese-games') {
    return <CantoneseGuide />;
  }
  return <Home />;
}

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <StrictMode>
    <Router />
  </StrictMode>,
);
