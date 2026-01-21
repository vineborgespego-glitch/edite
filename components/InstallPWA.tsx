
import React, { useState, useEffect } from 'react';

const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [logoSrc, setLogoSrc] = useState('logo.png');

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

  const handleLogoError = () => {
    if (logoSrc === 'logo.png') setLogoSrc('logo.jpg');
    else if (logoSrc === 'logo.jpg') setLogoSrc('logo.jpeg');
    else setLogoSrc('https://via.placeholder.com/150?text=Atelier+Logo');
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_install_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[100] animate-bounce-in">
      <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 rounded-3xl shadow-2xl p-5 flex flex-col items-center text-center space-y-4 max-w-sm mx-auto">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm p-1 overflow-hidden border border-rose-50">
          <img 
            src={logoSrc} 
            alt="Logo" 
            className="w-full h-full object-contain" 
            onError={handleLogoError}
          />
        </div>
        
        <div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Instalar App Atelier</h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-medium">Acesse a gestão do seu atelier direto da tela inicial.</p>
        </div>
        
        <div className="flex flex-col w-full gap-2">
          <button 
            onClick={handleInstall}
            className="w-full py-3 bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-rose-100 dark:shadow-none active:scale-95 transition-all"
          >
            Instalar Agora
          </button>
          <button 
            onClick={handleDismiss}
            className="w-full py-2 text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase hover:text-red-500 transition-colors"
          >
            Agora não
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes bounce-in {
          0% { transform: translateY(20px); opacity: 0; }
          60% { transform: translateY(-5px); opacity: 1; }
          100% { transform: translateY(0); }
        }
        .animate-bounce-in { animation: bounce-in 0.6s cubic-bezier(0.17, 0.67, 0.83, 0.67); }
      `}</style>
    </div>
  );
};

export default InstallPWA;
