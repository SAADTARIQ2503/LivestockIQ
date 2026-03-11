import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize auth store on app start
import { useAuthStore } from './store/authStore';
useAuthStore.getState().initializeAuth();

// Re-apply persisted theme on page load
const savedUI = JSON.parse(localStorage.getItem('ui-storage') || '{}');
if (savedUI?.state?.theme === 'dark') {
  document.documentElement.classList.add('dark');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
