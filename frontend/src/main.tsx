import './theme/index.scss';
import './theme/fonts.scss';
import './theme/tailwind.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import { LoansProvider } from './context/LoansProvider.tsx';
import { WalletProvider } from './context/WalletProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletProvider>
      <LoansProvider>
        <App />
      </LoansProvider>
    </WalletProvider>
  </StrictMode>
);
