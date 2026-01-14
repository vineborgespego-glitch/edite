
import React, { useState, useEffect } from 'react';

const ThemeToggle: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => 
    document.documentElement.classList.contains('dark')
  );

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ia_finance_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ia_finance_theme', 'light');
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
