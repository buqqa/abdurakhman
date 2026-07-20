import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './screens.css';
import { I18nProvider } from './i18n/I18nContext';
import './entities.css';
import './structures.css';
import { ControlsProvider } from './game/controls';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider><ControlsProvider><App /></ControlsProvider></I18nProvider>
  </React.StrictMode>,
);
