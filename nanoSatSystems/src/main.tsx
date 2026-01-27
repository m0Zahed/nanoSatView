
import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import { AuthProvider } from '@/app/auth/AuthContext';
import './styles/index.css';

// Normalize the initial path so React Router can match routes reliably.
// Handles cases like leading double slashes from OAuth redirects and accidental spaces in the path.
(function normalizeInitialPath() {
  const rawPath = window.location.pathname;
  let path = rawPath;

  // Decode in case we received percent-encoded spaces (e.g., "/complete%20profile")
  try {
    path = decodeURIComponent(path);
  } catch {
    // keep raw path on decode failure
  }

  // Collapse multiple slashes
  path = path.replace(/\/{2,}/g, '/');

  // Trim trailing slashes (except for root)
  if (path.length > 1) {
    path = path.replace(/\/+$/, '');
  }

  // Canonicalize known routes that users/OAuth flows might mangle
  if (/^\/complete[\s_-]?profile$/i.test(path)) {
    path = '/complete-profile';
  }

  if (path !== rawPath) {
    const newUrl = `${path}${window.location.search}${window.location.hash}`;
    window.history.replaceState({}, '', newUrl);
  }
})();

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
  
