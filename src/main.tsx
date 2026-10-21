import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import './index.css';
import { LanguageProvider } from './context/LanguageContext';
import { AppStateProvider } from './state/AppStateContext';
import { router } from './routes';

createRoot(document.getElementById('root')!).render(
  <LanguageProvider>
    <AppStateProvider>
      <RouterProvider router={router} />
    </AppStateProvider>
  </LanguageProvider>
);
