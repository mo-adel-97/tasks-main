import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './index.css';
import './security/apiAuth';
import { AuthProvider } from './contexts/AuthContext';

import { ColorModeProvider } from './contexts/ColorModeContext';
import { CacheProvider } from '@emotion/react';
import { createAppCache } from './theme';

const cacheRtl = createAppCache();

const style = document.createElement('style');
style.innerHTML = `.swal2-container { z-index: 2500 !important; }`;
document.head.appendChild(style);


document.body.dir = 'rtl';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <CacheProvider value={cacheRtl}>
      <ColorModeProvider>
            <AuthProvider>
        <App />
            </AuthProvider>
      </ColorModeProvider>
    </CacheProvider>
  </React.StrictMode>
);

reportWebVitals();
