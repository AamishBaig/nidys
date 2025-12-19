import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';
import { MediaManagerProvider } from './context/MediaManagerContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <MediaManagerProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </MediaManagerProvider>
  </React.StrictMode>
);
