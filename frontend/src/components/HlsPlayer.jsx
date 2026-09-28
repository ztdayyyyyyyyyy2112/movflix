import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import './HlsPlayer.css';

const HlsPlayer = ({ src, title }) => {
  const videoRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return undefined;

    setError('');
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return undefined;
    }

    if (!Hls.isSupported()) {
      setError('Trình duyệt này không hỗ trợ phát HLS.');
      return undefined;
    }

    const hls = new Hls();
    hls.loadSource(src);
    hls.attachMedia(video);
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) setError('Không thể tải luồng video. Vui lòng thử lại sau.');
    });

    return () => hls.destroy();
  }, [src]);

  return (
    <div className="hls-player">
      <video ref={videoRef} controls autoPlay playsInline aria-label={title} />
      {error && <p className="hls-player-error" role="status">{error}</p>}
    </div>
  );
};

export default HlsPlayer;