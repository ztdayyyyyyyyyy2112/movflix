import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './Navbar.css';

const Navbar = ({ onSearch, allTitles = [], genres, selectedGenre, onGenreChange, onClearFilters, onShowSaved, onNavigatePage, activePage, searchTerm, onLoginClick, onLogout, user }) => {
  const { t, toggleLanguage, language } = useLanguage();
  const searchRef = useRef(null);
  const [inputValue, setInputValue] = useState(searchTerm);
  const [suggestions, setSuggestions] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  useEffect(() => { if (searchOpen) searchRef.current?.focus(); }, [searchOpen]);
  useEffect(() => { setInputValue(searchTerm); }, [searchTerm]);
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    if (value.trim()) { const filtered = allTitles.filter(title => title.toLowerCase().includes(value.toLowerCase())).slice(0,5); setSuggestions(filtered); }
    else setSuggestions([]);
  };
  const handleSearchSubmit = (e) => { e.preventDefault(); onSearch(inputValue); setSuggestions([]); };
  const handleSuggestionClick = (suggestion) => { setInputValue(suggestion); onSearch(suggestion); setSuggestions([]); };
  return (
    <header className={`navbar ${isScrolled ? 'scrolled' : ''} ${searchOpen ? 'search-active' : ''}`}>
      <div className="nav-left">
        <a className="brand-lockup" href="#top" aria-label="Movieflix, trang chủ" onClick={event => { event.preventDefault(); onNavigatePage('home'); }}>
          <svg className="brand-mark" viewBox="0 0 32 36" role="img" aria-label="M">
            <path d="M3 34V2l13 22L29 2v32h-7V20l-6 10-6-10v14H3Z" fill="currentColor" />
          </svg>
          <span>MOVIEFLIX</span>
        </a>
        <nav className="nav-links" aria-label="Điều hướng chính">
          <button className={activePage === 'home' ? 'active' : ''} type="button" onClick={() => onNavigatePage('home')}>Trang chủ</button>
          <button className={activePage === 'tv' ? 'active' : ''} type="button" onClick={() => onNavigatePage('tv')}>Phim Bộ</button>
          <button className={activePage === 'movies' ? 'active' : ''} type="button" onClick={() => onNavigatePage('movies')}>Phim Chiếu Rạp</button>
          <button className={activePage === 'new' ? 'active' : ''} type="button" onClick={() => onNavigatePage('new')}>Mới &amp; phổ biến</button>
          <button type="button" onClick={onShowSaved}>Danh sách của tôi</button>
        </nav>
      </div>
      <div className="nav-right">
        <form onSubmit={handleSearchSubmit} className={`search-form ${searchOpen ? 'is-open' : ''}`}>
          <input ref={searchRef} type="text" placeholder={t('searchPlaceholder')} value={inputValue} onChange={handleInputChange} onKeyDown={event => event.key === 'Escape' && setSearchOpen(false)} className="search-input" aria-label={t('searchPlaceholder')} />
          <button type="button" className="search-btn" aria-label="Mở tìm kiếm" onClick={() => setSearchOpen(open => !open)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
          {suggestions.length > 0 && (<div className="suggestions-dropdown"><div className="suggestions-title">{t('suggestions')}</div>{suggestions.map((s, idx) => (<div key={idx} className="suggestion-item" onClick={() => handleSuggestionClick(s)}>{s}</div>))}</div>)}
        </form>
        <select value={selectedGenre} onChange={(e) => onGenreChange(e.target.value)} className="genre-filter" aria-label={t('filterByGenre')}><option value="">Thể loại</option>{genres.map(genre => (<option key={genre} value={genre}>{genre}</option>))}</select>
        {(selectedGenre || searchTerm) && <button onClick={onClearFilters} className="clear-btn">{t('clearFilters')}</button>}
        <div className="notification-wrap">
          <button type="button" className="icon-button notification-button" aria-label="Thông báo" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(open => !open)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg><span className="notification-badge">2</span>
          </button>
          {notificationsOpen && <div className="notification-menu"><strong>Thông báo mới</strong><p>Khám phá những bộ phim đang được quan tâm.</p><p>Danh sách phim mới đã được cập nhật.</p></div>}
        </div>
        <button onClick={toggleLanguage} className="lang-btn">{language === 'vie' ? 'ENG' : 'VIE'}</button>
        {user ? (
          <div className="profile-wrap">
            <button className="profile-trigger" type="button" aria-label="Tùy chọn hồ sơ">{user.avatarUrl ? <img src={user.avatarUrl} alt="" className="avatar-img" /> : <span className="avatar-placeholder">{(user.name || user.username || 'U').charAt(0).toUpperCase()}</span>}<span className="profile-caret">⌄</span></button>
            <div className="profile-menu"><span className="profile-name">{user.name || user.username || 'Hồ sơ của tôi'}</span><button type="button" onClick={onShowSaved}>Danh sách của tôi</button><button type="button" onClick={onLogout}>Đăng xuất</button></div>
          </div>
        ) : onLoginClick && (
          <button className="login-btn-nav" onClick={onLoginClick}>Đăng nhập</button>
        )}
      </div>
    </header>
  );
};
export default Navbar;