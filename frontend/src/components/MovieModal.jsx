import React from 'react';
import { useState } from 'react';
import HlsPlayer from './HlsPlayer';
import './MovieModal.css';

const MovieModal = ({ movie, onClose, isIntro, onLoginClick }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  if (!movie) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-body">
          <div className="modal-banner">
            {isPlaying && movie.streamUrl
              ? <HlsPlayer src={movie.streamUrl} title={movie.title} />
              : <img src={movie.banner || movie.poster} alt={movie.title} />}
          </div>

          <div className="modal-info">
            <h2 className="modal-title">{movie.title}</h2>
            <p className="modal-year">{movie.genres?.join(' · ')}</p>

            <div className="modal-description">
              <p>{movie.description}</p>
            </div>

            <button className="modal-play-btn" disabled={!isIntro && !movie.streamUrl} onClick={isIntro ? onLoginClick : () => setIsPlaying(true)}>
              {isIntro ? 'Đăng nhập để xem' : '▶ Phát'}
            </button>
            {!isIntro && !movie.streamUrl && <p className="stream-unavailable" role="status">Chưa có luồng HLS được cấp phép cho phim này.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieModal;
