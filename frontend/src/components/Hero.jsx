import React, { useState } from 'react';
import './Hero.css';
const Hero = ({ movie, isIntro, onLoginClick, onMovieSelect }) => {
  const [muted, setMuted] = useState(true);
  if (!movie) return null;
  const backdrop = movie.banner || movie.poster;
  return (
    <section className="hero" id="top" style={{ backgroundImage: `url(${backdrop})` }}>
      {movie.trailerUrl && <video className="hero-video" src={movie.trailerUrl} poster={backdrop} autoPlay loop muted={muted} playsInline aria-label={`Trailer ${movie.title}`} />}
      <div className="hero-vignette" />
      <div className="hero-content">
        <p className="hero-eyebrow">MOVIEFLIX ORIGINAL</p>
        <h1 className="hero-title">{movie.title}</h1>
        <div className="hero-meta"><span>{movie.genres?.[0] || 'Phim nổi bật'}</span></div>
        <p className="hero-overview">{movie.description}</p>
        <div className="hero-buttons">
          <button className="play-btn" onClick={isIntro ? onLoginClick : () => onMovieSelect(movie)}> {/* Sửa logic onClick */}
            {isIntro ? 'Đăng nhập để xem' : '▶ Phát'}
          </button>
          <button className="info-btn" onClick={() => onMovieSelect(movie)}>ℹ Thông tin</button> {/* Thêm onClick */}
        </div>
      </div>
      <div className="hero-controls">
        {movie.trailerUrl && <button className="sound-btn" type="button" aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'} onClick={() => setMuted(value => !value)}>{muted ? '♪̸' : '♪'}</button>}
        <div className="hero-rating">{movie.ageRating || 'HD'}</div>
      </div>
    </section>
  );
};
export default Hero;