import React, { useState, useEffect } from 'react';
import { HiSun, HiMoon } from 'react-icons/hi';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <button 
      className="relative bg-white/10 border-2 border-white/20 hover:border-green-400 rounded-full p-1.5 cursor-pointer transition-all duration-300 backdrop-blur-xl hover:shadow-md hover:shadow-green-400/10 hover:scale-105 active:scale-95"
      onClick={toggleTheme} 
      aria-label="Toggle theme"
    >
      <div className="relative w-16 h-8 rounded-full bg-green-600 shadow-sm overflow-hidden">
        <div className={`absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white flex items-center justify-center transition-all duration-400 shadow-md ${
          isDark ? 'left-0.5 text-green-700' : 'left-[calc(100%-30px)] text-amber-500'
        }`}>
          {isDark ? (
            <HiMoon className="w-4 h-4 transition-transform duration-300" />
          ) : (
            <HiSun className="w-5 h-5 transition-transform duration-300" />
          )}
        </div>
      </div>
    </button>
  );
}
