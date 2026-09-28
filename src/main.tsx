import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './interface/App';
import './interface/estilo.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
