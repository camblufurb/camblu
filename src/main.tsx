import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App';
import { installGlobalErrorLogging, logInfo } from './lib/logger';

installGlobalErrorLogging();
logInfo('Bootstrap', 'Inicializando Portal CAMBLU', {
  mode: import.meta.env.MODE,
  origin: window.location.origin,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
