import React, { createContext, useState, useContext } from 'react';
const LanguageContext = createContext();
export const useLanguage = () => useContext(LanguageContext);
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('vie');
  const translations = {
    vie: { searchPlaceholder: 'Tìm kiếm phim, thể loại...', trending: '🔥 Phim Hot', action: '🎬 Hành Động', comedy: '😂 Hài Hước', romance: '💕 Lãng Mạn', horror: '👻 Kinh Dị', sciFi: '🚀 Viễn Tưởng', mystery: '🔍 Bí Ẩn', filterByGenre: 'Lọc theo thể loại', clearFilters: 'Xóa bộ lọc', searchResults: 'Kết quả tìm kiếm', noResults: 'Không tìm thấy phim nào', suggestions: 'Gợi ý từ khóa' },
    eng: { searchPlaceholder: 'Search movies, genres...', trending: '🔥 Trending Now', action: '🎬 Action', comedy: '😂 Comedy', romance: '💕 Romance', horror: '👻 Horror', sciFi: '🚀 Sci-Fi', mystery: '🔍 Mystery', filterByGenre: 'Filter by genre', clearFilters: 'Clear filters', searchResults: 'Search Results', noResults: 'No movies found', suggestions: 'Keyword suggestions' }
  };
  const t = (key) => translations[language][key] || key;
  const toggleLanguage = () => setLanguage(prev => prev === 'vie' ? 'eng' : 'vie');
  return <LanguageContext.Provider value={{ language, toggleLanguage, t }}>{children}</LanguageContext.Provider>;
};