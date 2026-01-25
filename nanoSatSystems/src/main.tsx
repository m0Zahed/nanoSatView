
import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import { AuthProvider } from '@/app/auth/AuthContext';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
  
