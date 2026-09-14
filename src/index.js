import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './index.css';
import './security/apiAuth';
import { AuthProvider } from './contexts/AuthContext';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import theme, { createAppCache } from './theme';

const cacheRtl = createAppCache();

const style = document.createElement('style');
style.innerHTML = `.swal2-container { z-index: 2500 !important; }`;
document.head.appendChild(style);


document.body.dir = 'rtl';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
            <AuthProvider>
        <App />
            </AuthProvider>
      </ThemeProvider>
    </CacheProvider>
  </React.StrictMode>
);

reportWebVitals();
