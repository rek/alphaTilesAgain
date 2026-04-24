import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Home } from './app/home';
import './styles.css';

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <StrictMode>
    <Home />
  </StrictMode>,
);
