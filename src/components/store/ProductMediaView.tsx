import React, { useEffect, useRef, useState } from 'react';
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
  const videoRef = useRef<HTMLVideoElement>(null);

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

    videoEl.defaultMuted = muted;
    videoEl.muted = muted;
    videoEl.playsInline = true;

    if (autoPlay) {
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          videoEl.muted = true;
          videoEl.play().catch(() => {});
        });
      }
    }
  }, [isVideo, playableUrl, autoPlay, muted]);

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
          ref={videoRef}
          key={playableUrl}
          src={playableUrl}
          poster={poster}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          playsInline
          controls={controls}
          preload="auto"
          onLoadedData={(e) => {
            const el = e.currentTarget;
            el.defaultMuted = muted;
            el.muted = muted;
            if (autoPlay && el.paused) {
              el.play().catch(() => {});
            }
          }}
          className={className}
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
