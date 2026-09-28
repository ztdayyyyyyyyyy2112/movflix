import React, { createContext, useState, useContext, useEffect } from 'react';
const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);
export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => { const saved = localStorage.getItem('theme'); if (saved === 'light') setIsDark(false); else if (saved === 'dark') setIsDark(true); else setIsDark(true); }, []);
  useEffect(() => { if (isDark) { document.body.classList.remove('light-theme'); localStorage.setItem('theme','dark'); } else { document.body.classList.add('light-theme'); localStorage.setItem('theme','light'); } }, [isDark]);
  const toggleTheme = () => setIsDark(!isDark);
  return <ThemeContext.Provider value={{ isDark, toggleTheme }}>{children}</ThemeContext.Provider>;
};