
import React, { useState, useEffect } from 'react';

const ThemeToggle: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => 
    document.documentElement.classList.contains('dark')
  );

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    const themeStr = newMode ? 'dark' : 'light';
    
    // Aplica no DOM Principal
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Salva globalmente (para a tela de login)
    localStorage.setItem('ia_finance_theme', themeStr);

    // Salva especificamente para o usuário logado (se houver)
    const savedUser = localStorage.getItem('ia_finance_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user && user.id) {
          localStorage.setItem(`ia_finance_theme_user_${user.id}`, themeStr);
        }
      } catch (e) {
        console.error("Erro ao salvar tema do usuário:", e);
      }
    }

    // Atualiza o meta tag theme-color manualmente para resposta imediata
    const meta = document.getElementById('theme-meta');
    if (meta) {
      meta.setAttribute('content', newMode ? '#0f172a' : '#fffafb');
    }
  };

  return (
    <button 
      onClick={toggleTheme} 
      className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-amber-400 hover:scale-110 active:scale-95 transition-all shadow-sm border border-gray-100 dark:border-slate-700"
      title="Alternar Tema"
    >
      <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-lg`}></i>
    </button>
  );
};

export default ThemeToggle;
