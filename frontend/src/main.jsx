console.log("main.jsx is executing!");
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log("Imports loaded, calling createRoot...");
const rootElement = document.getElementById('root');
console.log("Root element is:", rootElement);

createRoot(rootElement).render(
  <App />
);
console.log("Render called!");
