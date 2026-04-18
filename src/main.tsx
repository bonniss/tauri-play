import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProvider } from './components/layout/AppProvider';
import { isProd } from './lib/env';
import { setupI18n } from './lib/i18n';
import { AppRouter } from './router';

import '@mantine/core/styles.css';
import './styles/index.css';
import { logger } from './lib/logger';

{
  logger.debug('App setting up...');
  if (isProd) {
    document.addEventListener('contextmenu', (event) => event.preventDefault());
    logger.debug('Context menu disabled.');
  }

  const i18nKey = '$locale';
  setupI18n({
    getLocale: () => localStorage.getItem(i18nKey) || 'vi',
    setLocale: (locale) => localStorage.setItem(i18nKey, locale),
  });
  logger.debug('I18n setup done.');
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppProvider>
      <AppRouter />
    </AppProvider>
  </React.StrictMode>,
);
