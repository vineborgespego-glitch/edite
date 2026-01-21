
import React, { useState, useEffect } from 'react';

const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const isDismissed = localStorage.getItem('pwa_install_dismissed');
      if (!isDismissed) setIsVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[100] animate-bounce-in">
      <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 rounded-[2rem] shadow-2xl p-6 flex flex-col items-center text-center space-y-4 max-w-sm mx-auto">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm p-1 border border-rose-50">
          <img src="logo.jpeg" alt="Logo" className="w-full h-full object-contain" />
        </div>
        
        <div>
          <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Instalar App Atelier</h3>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 font-bold uppercase tracking-tighter">Acesso rápido direto da sua tela inicial</p>
        </div>
        
        <button 
          onClick={handleInstall}
          className="w-full py-4 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-rose-100 active:scale-95 transition-all"
        >
          Instalar Agora
        </button>
        
        <button 
          onClick={() => setIsVisible(false)}
          className="text-[9px] text-gray-400 font-bold uppercase tracking-widest"
        >
          Agora não
        </button>
      </div>
    </div>
  );
};

export default InstallPWA;
