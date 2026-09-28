import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MovieRow from './components/MovieRow';
import SearchResults from './components/SearchResults';
import MovieModal from './components/MovieModal';
import Footer from './components/Footer';
import './App.css';

const MOVIES_API = '/api/v1/movies';

function App() {
  const [movies, setMovies] = useState([]);
  const [catalogMovies, setCatalogMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [genres, setGenres] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showSaved, setShowSaved] = useState(false);
  const [activePage, setActivePage] = useState('home');
  const [savedMovieIds, setSavedMovieIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('savedMovieIds') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    axios.get(`${MOVIES_API}/genres`)
      .then(response => setGenres(response.data))
      .catch(() => setGenres([]));
  }, []);

  useEffect(() => {
    let active = true;
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (selectedGenre) params.genre = selectedGenre;

    setLoading(true);
    setCatalogError('');
    axios.get(MOVIES_API, { params })
      .then(response => {
        if (!active) return;
        const results = response.data || [];
        setMovies(results);
        if (!searchTerm && !selectedGenre) setCatalogMovies(results);
      })
      .catch(() => {
        if (active) setCatalogError('Không thể tải danh sách phim lúc này. Vui lòng thử lại sau.');
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [searchTerm, selectedGenre]);

  const handleSearch = (term) => setSearchTerm(term);
  const handleGenreFilter = (genre) => setSelectedGenre(genre);
  const clearFilters = () => { setSearchTerm(''); setSelectedGenre(''); setShowSaved(false); };
  const navigateToPage = (page) => {
    setActivePage(page);
    setShowSaved(page === 'my-list');
    setSearchTerm('');
    setSelectedGenre('');
  };
  const showMyList = () => navigateToPage('my-list');
  const toggleSavedMovie = (movie) => {
    const nextSavedIds = savedMovieIds.includes(movie.id)
      ? savedMovieIds.filter(id => id !== movie.id)
      : [...savedMovieIds, movie.id];
    setSavedMovieIds(nextSavedIds);
    localStorage.setItem('savedMovieIds', JSON.stringify(nextSavedIds));
  };

  const hasActiveFilters = searchTerm !== '' || selectedGenre !== '';
  const isBrowsing = hasActiveFilters || showSaved || activePage !== 'home';
  const savedMovies = catalogMovies.filter(movie => savedMovieIds.includes(movie.id));
  const pageTitles = { tv: 'Phim truyền hình', movies: 'Phim điện ảnh', new: 'Mới & phổ biến' };

  return (
    <div className={`app ${isBrowsing ? 'app-catalog' : ''}`}>
      <Navbar onSearch={handleSearch} allTitles={catalogMovies.map(movie => movie.title)} genres={genres} selectedGenre={selectedGenre} onGenreChange={handleGenreFilter} onClearFilters={clearFilters} onShowSaved={showMyList} onNavigatePage={navigateToPage} activePage={activePage} searchTerm={searchTerm} />
      {!isBrowsing && movies.length > 0 && <Hero movie={movies[0]} onMovieSelect={setSelectedMovie} />}
      <div className="movie-rows-container">
        {loading ? <div className="search-skeleton" aria-label="Đang tải phim">{Array.from({ length: 6 }, (_, index) => <div className="skeleton-card" key={index} />)}</div> : catalogError ? (
          <p className="catalog-error" role="status">{catalogError}</p>
        ) : hasActiveFilters ? (
          <SearchResults title="Kết quả tìm kiếm" movies={movies} searchTerm={searchTerm} selectedGenre={selectedGenre} onMovieSelect={setSelectedMovie} />
        ) : showSaved ? (
          savedMovies.length > 0
            ? <SearchResults title="Danh sách của tôi" movies={savedMovies} onMovieSelect={setSelectedMovie} />
            : <p className="empty-list">Danh sách của bạn đang trống.</p>
        ) : activePage !== 'home' ? (
          <SearchResults title={pageTitles[activePage] || 'Mới & phổ biến'} movies={movies} onMovieSelect={setSelectedMovie} />
        ) : (
          <>
            <MovieRow id="trending" title="Mới & phổ biến" movies={movies} onMovieSelect={setSelectedMovie} savedMovieIds={savedMovieIds} onToggleSaved={toggleSavedMovie} />
            {genres.map(genre => (
              <MovieRow key={genre} title={genre} movies={movies.filter(movie => movie.genres?.includes(genre))} onMovieSelect={setSelectedMovie} savedMovieIds={savedMovieIds} onToggleSaved={toggleSavedMovie} />
            ))}
            {!movies.length && <p className="empty-list">Chưa có phim để hiển thị. Hãy kiểm tra cấu hình TMDB_API_KEY.</p>}
          </>
        )}
      </div>
      {selectedMovie && <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />}
      <Footer />
    </div>
  );
}

export default App;
