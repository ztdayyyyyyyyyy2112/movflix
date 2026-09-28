import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './SearchResults.css';
const SearchResults = ({ title, movies, searchTerm, selectedGenre, onMovieSelect }) => {
  const { t } = useLanguage();

  const handleMovieClick = (movie) => {
    if (onMovieSelect) {
      onMovieSelect(movie);
    }
  };

  return (
    <div className="search-results">
      <h2>{title || t('searchResults')} <span>({movies.length})</span></h2>
      {movies.length === 0 ? (<p className="no-results">{t('noResults')}</p>) : (
        <div className="results-grid">{movies.map(movie => (
          <div
            key={movie.id}
            className="result-card"
            onClick={() => handleMovieClick(movie)}
            role="button"
            tabIndex="0"
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleMovieClick(movie);
              }
            }}
          >
            {movie.poster || movie.banner
              ? <img src={movie.poster || movie.banner} alt={movie.title} />
              : <div className="result-poster-placeholder" aria-label={movie.title}>{movie.title}</div>}
            <div className="result-info">
              <h4>{movie.title}</h4>
              <p>{movie.genres?.join(', ')}</p>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  );
};
export default SearchResults;