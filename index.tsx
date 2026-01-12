
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Filtro para limpar avisos irrelevantes do Recharts no console
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' && 
    (args[0].includes('The width(-1) and height(-1) of chart') || 
     args[0].includes('ResponsiveContainer'))
  ) {
    return;
  }
  originalWarn(...args);
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
