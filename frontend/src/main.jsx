console.log("main.jsx is executing!");
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios'
import useAuthStore from '@store/auth'
import useNotificationStore from '@store/notifications'

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("Session expired or unauthorized (401). Logging out...");
            useAuthStore.getState().logout();
            useNotificationStore.getState().addNotification(
                "Session Expired",
                "Your session has expired. Please log in again.",
                "error"
            );
        }
        return Promise.reject(error);
    }
);

console.log("Imports loaded, calling createRoot...");
const rootElement = document.getElementById('root');
console.log("Root element is:", rootElement);

createRoot(rootElement).render(
  <App />
);
console.log("Render called!");
