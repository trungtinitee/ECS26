import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { applyTheme, getStoredTheme } from './utils/theme';

// Initialize dark/light mode before react renders
applyTheme(getStoredTheme());

createRoot(document.getElementById('root')!).render(<App />);
