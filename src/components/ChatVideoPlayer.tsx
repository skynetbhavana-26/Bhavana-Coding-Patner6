import React, { useState, useEffect, useRef } from 'react';
import { Play, Maximize2, AlertCircle, RefreshCw, Loader2, Download } from 'lucide-react';
import { getLocalMediaBlob } from '../utils/upload';

interface ChatVideoPlayerProps {
  videoUrl: string;
  onOpenFullscreen?: () => void;
  senderName?: string;
  className?: string;
}

export const ChatVideoPlayer: React.FC<ChatVideoPlayerProps> = ({
  videoUrl,
  onOpenFullscreen,
  senderName,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentSrc, setCurrentSrc] = useState<string>(() => {
    return getLocalMediaBlob(videoUrl) || videoUrl;
  });
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync when videoUrl changes
  useEffect(() => {
    const local = getLocalMediaBlob(videoUrl);
    setCurrentSrc(local || videoUrl);
    setIsLoaded(false);
    setIsLoading(true);
    setHasError(false);
    setRetryCount(0);

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [videoUrl]);

  const handleLoadedData = () => {
    setIsLoaded(true);
    setIsLoading(false);
    setHasError(false);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    // If we have retries remaining, back off and retry with a cache-busting query parameter
    if (retryCount < 30) {
      setIsLoading(true);
      const nextCount = retryCount + 1;
      setRetryCount(nextCount);

      const delay = Math.min(1000 + nextCount * 300, 3000);
      retryTimeoutRef.current = setTimeout(() => {
        const cleanBase = videoUrl.split('?')[0];
        const refreshed = `${cleanBase}?t=${Date.now()}`;
        setCurrentSrc(refreshed);
        if (videoRef.current) {
          videoRef.current.load();
        }
      }, delay);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  };

  const handleManualRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setIsLoading(true);
    setRetryCount(0);
    const cleanBase = videoUrl.split('?')[0];
    const refreshed = `${cleanBase}?t=${Date.now()}`;
    setCurrentSrc(refreshed);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-white/20 bg-black/80 shadow-lg group max-w-sm ${className}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={currentSrc}
        controls
        playsInline
        preload="metadata"
        className={`w-full max-h-72 object-contain rounded-2xl bg-black block transition-opacity duration-300 ${
          isLoaded || !isLoading ? 'opacity-100' : 'opacity-40 min-h-[140px]'
        }`}
        onLoadedData={handleLoadedData}
        onCanPlay={handleCanPlay}
        onLoadedMetadata={() => setIsLoading(false)}
        onError={handleError}
      />

      {/* Loading overlay while waiting for server video streaming or upload finish */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 text-white z-10 pointer-events-none">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          <span className="text-[11px] font-medium text-slate-300">Loading video...</span>
        </div>
      )}

      {/* Error / Retry Fallback */}
      {hasError && (
        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center z-10">
          <AlertCircle className="w-7 h-7 text-amber-400 mb-1.5" />
          <p className="text-xs text-slate-200 font-medium mb-2.5">
            Unable to stream video preview
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualRetry}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <a
              href={videoUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          </div>
        </div>
      )}

      {/* Fullscreen Expansion Button */}
      {onOpenFullscreen && !hasError && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenFullscreen();
          }}
          className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/75 hover:bg-black/95 text-white border border-white/20 backdrop-blur-sm transition-all opacity-85 group-hover:opacity-100 flex items-center gap-1.5 text-xs cursor-pointer z-20 shadow-lg"
          title="Open in full screen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">Full screen</span>
        </button>
      )}
    </div>
  );
};
