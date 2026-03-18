import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@/app/App';
import { ensureWorkspaceBackupRestored } from '@/app/store/workspaceBackup';
import '@/shared/styles/global.css';

ensureWorkspaceBackupRestored();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
