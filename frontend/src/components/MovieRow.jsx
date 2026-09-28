import React, { useRef, useState } from 'react';
import './MovieRow.css';

const MovieRow = ({ id, title, movies, onMovieSelect, savedMovieIds = [], onToggleSaved }) => {
  const sliderRef = useRef(null);
  const [previewMovieId, setPreviewMovieId] = useState(null);

  if (!movies || movies.length === 0) return null;

  const scroll = (direction) => sliderRef.current?.scrollBy({ left: direction * sliderRef.current.clientWidth * 0.82, behavior: 'smooth' });

  return (
    <section className="movie-row" id={id}>
      <div className="row-header">
        <h2>{title}</h2>
        <button className="row-all-link" type="button" onClick={() => scroll(1)}>Xem tất cả <span aria-hidden="true">›</span></button>
      </div>

      <div className="row-slider-wrap">
        <button className="slider-arrow slider-arrow-left" type="button" aria-label={`Cuộn ${title} sang trái`} onClick={() => scroll(-1)}>‹</button>
        <div className="row-posters" ref={sliderRef}>
          {movies.map((movie, index) => (
            <article
              key={movie.id}
              className="poster-card"
              style={{ '--card-index': index }}
              onClick={() => onMovieSelect?.(movie)}
              onMouseLeave={() => setPreviewMovieId(null)}
              onKeyDown={event => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) onMovieSelect?.(movie); }}
              onMouseEnter={event => {
                const rect = event.currentTarget.getBoundingClientRect();
                event.currentTarget.style.setProperty('--hover-origin', rect.left < 100 ? 'left center' : rect.right > window.innerWidth - 100 ? 'right center' : 'center center');
                setPreviewMovieId(movie.id);
              }}
              role="group"
              tabIndex="0"
              aria-label={`Xem thông tin ${movie.title}`}
            >
              {movie.poster || movie.banner
                ? <img src={movie.poster || movie.banner} alt={movie.title} className="row-poster" loading="lazy" />
                : <div className="poster-placeholder" aria-label={movie.title}>{movie.title}</div>}
              {movie.trailerUrl && <video className="card-preview-video" src={movie.trailerUrl} muted loop playsInline autoPlay={previewMovieId === movie.id} preload="none" />}
              <div className="poster-info">
                <div className="card-actions">
                  <button className="card-action card-play" type="button" aria-label={`Phát ${movie.title}`} onClick={event => { event.stopPropagation(); onMovieSelect?.(movie); }}>▶</button>
                  <button className="card-action" type="button" aria-label={savedMovieIds.includes(movie.id) ? 'Xóa khỏi danh sách' : 'Thêm vào danh sách'} onClick={event => { event.stopPropagation(); onToggleSaved?.(movie); }}>{savedMovieIds.includes(movie.id) ? '✓' : '+'}</button>
                  <button className="card-action card-info" type="button" aria-label={`Thông tin ${movie.title}`} onClick={event => { event.stopPropagation(); onMovieSelect?.(movie); }}>⌄</button>
                </div>
                <p className="poster-title">{movie.title}</p>
                <div className="poster-meta"><span>{movie.genres?.[0]}</span></div>
                <p className="poster-description">{movie.description}</p>
              </div>
            </article>
          ))}
        </div>
        <button className="slider-arrow slider-arrow-right" type="button" aria-label={`Cuộn ${title} sang phải`} onClick={() => scroll(1)}>›</button>
      </div>
    </section>
  );
};

export default MovieRow;