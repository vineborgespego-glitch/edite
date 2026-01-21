
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Função de registro silencioso do Service Worker.
 * Removemos todos os logs de console (log, debug) para evitar notificações 
 * não essenciais no ambiente de desenvolvimento/preview.
 */
const setupServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    const isIframe = window.self !== window.top;
    const isLocalhost = Boolean(
      window.location.hostname === 'localhost' ||
      window.location.hostname === '[::1]' ||
      window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
    );
    const isHttps = window.location.protocol === 'https:';

    // Tenta registrar apenas em ambientes reais e seguros, sem poluir o console
    if (!isIframe && (isHttps || isLocalhost)) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').catch(() => {
          /* Falha silenciosa para evitar avisos no console */
        });
      });
    }
  }
};

// Inicializa o PWA silenciosamente
setupServiceWorker();

// Filtro de console global: Intercepta e esconde mensagens técnicas irrelevantes
const silenceLogging = () => {
  const originalWarn = console.warn;
  const originalDebug = console.debug;
  const originalLog = console.log;

  const filterMessage = (args: any[]) => {
    if (args.length > 0 && typeof args[0] === 'string') {
      const msg = args[0].toLowerCase();
      const forbidden = [
        'serviceworker',
        'pwa:',
        'origin of the provided scripturl',
        'sandbox detectado',
        'the width(-1) and height(-1) of chart',
        'responsivecontainer',
        'failed to register',
        'scripturl'
      ];
      return forbidden.some(term => msg.includes(term));
    }
    return false;
  };

  console.warn = (...args: any[]) => {
    if (filterMessage(args)) return;
    originalWarn(...args);
  };

  console.debug = (...args: any[]) => {
    if (filterMessage(args)) return;
    originalDebug(...args);
  };

  console.log = (...args: any[]) => {
    if (filterMessage(args)) return;
    originalLog(...args);
  };
};

// Ativa o silenciamento de logs técnicos
silenceLogging();

// Montagem do Aplicativo React
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Não foi possível encontrar o elemento 'root' para montar a aplicação.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
