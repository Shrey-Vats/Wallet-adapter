import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import '@solana/wallet-adapter-react-ui/styles.css';
import WalletConnectionProvider from './provider/WalletConnectionProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletConnectionProvider>
    <App />
    </WalletConnectionProvider>
  </StrictMode>,
)
