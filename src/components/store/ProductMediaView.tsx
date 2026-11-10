import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play } from 'lucide-react';
import {
  isVideoMedia,
  getPlayableVideoUrl,
  resolveVideoMediaUrl,
} from '../../lib/productClassifier';

interface ProductMediaViewProps {
  src?: string;
  alt?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  poster?: string;
  showVideoBadge?: boolean;
}

export const ProductMediaView: React.FC<ProductMediaViewProps> = ({
  src,
  alt = '',
  className = 'w-full h-full object-cover',
  autoPlay = true,
  muted = true,
  loop = true,
  controls = false,
  poster,
  showVideoBadge = false,
}) => {
  const isVideo = isVideoMedia(src);
  const [playableUrl, setPlayableUrl] = useState<string>(() =>
    isVideo ? getPlayableVideoUrl(src) : src || ''
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const ensureMobileVideoPlay = useCallback(
    (el: HTMLVideoElement | null) => {
      if (!el || !isVideo) return;
      el.defaultMuted = muted;
      el.muted = muted;
      el.playsInline = true;
      el.setAttribute('playsinline', '');
      el.setAttribute('webkit-playsinline', '');
      if (muted) {
        el.setAttribute('muted', '');
      } else {
        el.removeAttribute('muted');
      }

      if (autoPlay && el.paused) {
        const playPromise = el.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            el.defaultMuted = true;
            el.muted = true;
            el.setAttribute('muted', '');
            el.play().catch(() => {});
          });
        }
      }
    },
    [isVideo, autoPlay, muted]
  );

  useEffect(() => {
    let mounted = true;
    if (!isVideo) {
      setPlayableUrl(src || '');
      return;
    }

    const syncUrl = getPlayableVideoUrl(src);
    if (syncUrl) {
      setPlayableUrl(syncUrl);
    } else {
      resolveVideoMediaUrl(src).then((resolved) => {
        if (mounted && resolved) {
          setPlayableUrl(resolved);
        }
      });
    }

    const handleBlobReady = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail && detail.idbRef === src && detail.url && mounted) {
        setPlayableUrl(detail.url);
      }
    };

    window.addEventListener('aura_video_blob_ready', handleBlobReady);
    return () => {
      mounted = false;
      window.removeEventListener('aura_video_blob_ready', handleBlobReady);
    };
  }, [src, isVideo]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!isVideo || !videoEl || !playableUrl) return;

    ensureMobileVideoPlay(videoEl);

    if (!autoPlay) return;

    // Desbloqueia reprodução automática no iOS Safari / Android Chrome ao primeiro toque ou rolagem
    const unlockOnTouch = () => {
      if (videoRef.current && videoRef.current.paused && autoPlay) {
        ensureMobileVideoPlay(videoRef.current);
      }
    };

    window.addEventListener('touchstart', unlockOnTouch, { passive: true });
    window.addEventListener('touchend', unlockOnTouch, { passive: true });
    window.addEventListener('scroll', unlockOnTouch, { passive: true });
    window.addEventListener('click', unlockOnTouch, { passive: true });

    return () => {
      window.removeEventListener('touchstart', unlockOnTouch);
      window.removeEventListener('touchend', unlockOnTouch);
      window.removeEventListener('scroll', unlockOnTouch);
      window.removeEventListener('click', unlockOnTouch);
    };
  }, [isVideo, playableUrl, autoPlay, muted, ensureMobileVideoPlay]);

  if (!isVideo) {
    return (
      <img
        src={src || poster || '/images/look-3103.png'}
        alt={alt}
        className={className}
      />
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {playableUrl ? (
        <video
          ref={(el) => {
            videoRef.current = el;
            if (el) {
              el.defaultMuted = muted;
              el.muted = muted;
              el.playsInline = true;
              el.setAttribute('playsinline', '');
              el.setAttribute('webkit-playsinline', '');
              if (muted) el.setAttribute('muted', '');
            }
          }}
          key={playableUrl}
          src={playableUrl}
          poster={poster}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          playsInline
          controls={controls}
          preload="auto"
          onLoadedMetadata={(e) => ensureMobileVideoPlay(e.currentTarget)}
          onLoadedData={(e) => ensureMobileVideoPlay(e.currentTarget)}
          onCanPlay={(e) => ensureMobileVideoPlay(e.currentTarget)}
          className={`${className} ${controls ? '' : 'pointer-events-none'}`}
        />
      ) : poster ? (
        <img src={poster} alt={alt} className={className} />
      ) : (
        <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
          <Play className="w-6 h-6 text-white/60 animate-pulse" />
        </div>
      )}

      {showVideoBadge && (
        <span className="absolute bottom-1.5 left-1.5 z-10 bg-black/75 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 pointer-events-none">
          <Play className="w-2.5 h-2.5 fill-white" />
          <span>VÍDEO</span>
        </span>
      )}
    </div>
  );
};
