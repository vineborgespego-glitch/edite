
import React, { useState, useEffect } from 'react';

const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Impede o mini-infobar padrão do Chrome
      e.preventDefault();
      // Guarda o evento para disparar depois
      setDeferredPrompt(e);
      
      // Verifica se o usuário já marcou para não mostrar novamente
      const isDismissed = localStorage.getItem('pwa_install_dismissed');
      if (!isDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Mostra o prompt de instalação
    deferredPrompt.prompt();
    
    // Espera a resposta do usuário
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Usuário respondeu à instalação: ${outcome}`);
    
    if (outcome === 'accepted') {
      localStorage.setItem('pwa_install_dismissed', 'true');
    }
    
    // Limpa o prompt
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    // Salva a preferência de não mostrar novamente
    localStorage.setItem('pwa_install_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[100] animate-bounce-in">
      <div className="bg-white dark:bg-slate-900 border-2 border-indigo-600/20 dark:border-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-6 flex flex-col items-center text-center space-y-4 max-w-sm mx-auto">
        <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] shadow-xl flex items-center justify-center text-white text-3xl mb-2">
          <i className="fa-solid fa-mobile-screen-button"></i>
        </div>
        
        <div>
          <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Instalar Aplicativo Oficial</h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 font-bold leading-relaxed">
            Transforme este site em um <span className="text-indigo-600 dark:text-indigo-400">aplicativo real</span> no seu celular. 
            <br/>Acesse rápido e use mesmo com internet instável.
          </p>
        </div>
        
        <div className="flex flex-col w-full gap-2 pt-2">
          <button 
            onClick={handleInstall}
            className="w-full py-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95 transition-all flex items-center justify-center space-x-2"
          >
            <i className="fa-solid fa-download"></i>
            <span>Baixar Aplicativo</span>
          </button>
          <button 
            onClick={handleDismiss}
            className="w-full py-2 text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase hover:text-red-500 transition-colors"
          >
            Agora não, obrigado
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes bounce-in {
          0% { transform: translateY(40px); opacity: 0; }
          70% { transform: translateY(-10px); opacity: 1; }
          100% { transform: translateY(0); }
        }
        .animate-bounce-in { animation: bounce-in 0.7s cubic-bezier(0.17, 0.67, 0.83, 0.67); }
      `}</style>
    </div>
  );
};

export default InstallPWA;
