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
  const [loadingMore, setLoadingMore] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [catalogMessage, setCatalogMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
    params.page = page;

    setLoading(page === 1);
    setLoadingMore(page > 1);
    setCatalogError('');
    setCatalogMessage('');
    axios.get(MOVIES_API, { params })
      .then(response => {
        if (!active) return;
        const catalog = response.data || {};
        const results = catalog.movies || [];
        const appendUnique = current => [
          ...current,
          ...results.filter(movie => !current.some(existing => existing.id === movie.id)),
        ];
        setMovies(current => page === 1 ? results : appendUnique(current));
        setTotalPages(catalog.totalPages || 1);
        setCatalogMessage(catalog.message || '');
        if (!searchTerm && !selectedGenre) {
          setCatalogMovies(current => page === 1 ? results : appendUnique(current));
        }
      })
      .catch(() => {
        if (active) setCatalogError('Không thể tải danh sách phim lúc này. Vui lòng thử lại sau.');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setLoadingMore(false);
        }
      });

    return () => { active = false; };
  }, [searchTerm, selectedGenre, page]);

  const handleSearch = (term) => { setPage(1); setSearchTerm(term); };
  const handleGenreFilter = (genre) => { setPage(1); setSelectedGenre(genre); };
  const clearFilters = () => { setPage(1); setSearchTerm(''); setSelectedGenre(''); setShowSaved(false); };
  const navigateToPage = (page) => {
    setActivePage(page);
    setPage(1);
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
      <main className="movie-rows-container">
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
            {!movies.length && (
              <section className="catalog-empty" role="status">
                <p className="catalog-empty-kicker">MOVIEFLIX CATALOG</p>
                <h1>{catalogMessage ? 'Catalog chưa sẵn sàng' : 'Chưa tìm thấy phim'}</h1>
                <p>{catalogMessage || 'Thử chọn thể loại khác hoặc xóa bộ lọc để khám phá thêm phim.'}</p>
                {catalogMessage.includes('TMDB_API_KEY') && <p className="catalog-empty-help">Thêm khóa TMDB vào <code>backend/.env</code>, sau đó khởi động lại backend.</p>}
              </section>
            )}
          </>
        )}
        {!loading && !catalogError && !showSaved && movies.length > 0 && page < totalPages && (
          <div className="load-more-wrap">
            <button className="load-more-btn" type="button" onClick={() => setPage(current => current + 1)} disabled={loadingMore}>
              {loadingMore ? 'Đang tải...' : 'Tải thêm phim'}
            </button>
          </div>
        )}
      </main>
      {selectedMovie && <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />}
      <Footer />
    </div>
  );
}

export default App;
