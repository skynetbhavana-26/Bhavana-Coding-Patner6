import React, { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, Download, Play, Pause } from 'lucide-react';
import { getLocalMediaBlob } from '../utils/upload';

interface FullscreenMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string | null;
  mediaType: 'image' | 'video';
  title?: string;
}

export const FullscreenMediaModal: React.FC<FullscreenMediaModalProps> = ({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  title,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset zoom and listeners when media opens or changes
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        } else if (e.key === 'f' || e.key === 'F') {
          toggleBrowserFullscreen();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, mediaUrl]);

  // Monitor native browser fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsBrowserFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!isOpen || !mediaUrl) return null;

  const resolvedUrl = getLocalMediaBlob(mediaUrl) || mediaUrl;

  const toggleBrowserFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (e) {
      console.warn('Browser fullscreen request avoided or blocked by iframe:', e);
    }
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.min(3, +(prev + 0.35).toFixed(2)));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.max(0.6, +(prev - 0.35).toFixed(2)));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(1);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = resolvedUrl;
    link.download = mediaUrl.split('/').pop() || (mediaType === 'video' ? 'video.mp4' : 'image.jpg');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Clicking on image toggles between normal 1x and zoomed 1.8x
    setZoomLevel((prev) => (prev > 1.1 ? 1 : 1.8));
  };

  return (
    <div
      ref={containerRef}
      id="fullscreen-media-modal"
      className="fixed inset-0 z-[1000] flex flex-col bg-black/95 backdrop-blur-xl select-none animate-fadeIn transition-all"
      onClick={onClose}
    >
      {/* Top Controls Bar */}
      <div
        className="w-full flex items-center justify-between px-4 py-3 bg-black/70 border-b border-white/10 z-20 backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Info badge & title */}
        <div className="flex items-center gap-2.5 text-white">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/15">
            {mediaType === 'video' ? '🎥 Video' : '📷 Photo'}
          </span>
          <span className="text-sm font-medium text-slate-200 truncate max-w-xs sm:max-w-md">
            {title || (mediaType === 'video' ? 'Shared Video' : 'Shared Photo')}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {mediaType === 'image' && (
            <>
              <button
                id="btn-zoom-in"
                onClick={handleZoomIn}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                id="btn-zoom-out"
                onClick={handleZoomOut}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              {zoomLevel !== 1 && (
                <button
                  id="btn-reset-zoom"
                  onClick={handleResetZoom}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1 text-xs"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">{Math.round(zoomLevel * 100)}%</span>
                </button>
              )}
            </>
          )}

          <button
            id="btn-native-fullscreen"
            onClick={toggleBrowserFullscreen}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title={isBrowserFullscreen ? 'Exit Full Screen' : 'Toggle Full Screen'}
          >
            {isBrowserFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            id="btn-download-media"
            onClick={handleDownload}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Download File"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            id="btn-close-fullscreen-media"
            onClick={onClose}
            className="p-2 rounded-lg bg-white/20 hover:bg-red-500/80 text-white transition-colors cursor-pointer ml-1 sm:ml-2"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Fullscreen Viewer Area */}
      <div className="flex-1 w-full h-full flex items-center justify-center p-2 sm:p-6 overflow-hidden relative">
        {mediaType === 'image' ? (
          <div
            className="w-full h-full flex items-center justify-center overflow-auto cursor-pointer"
            onClick={handleImageClick}
          >
            <img
              src={resolvedUrl}
              alt={title || 'Shared media fullscreen'}
              className="max-w-full max-h-[88vh] object-contain rounded-xl shadow-2xl transition-transform duration-200"
              style={{
                transform: `scale(${zoomLevel})`,
                cursor: zoomLevel > 1 ? 'zoom-out' : 'zoom-in',
              }}
            />
          </div>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center max-w-6xl max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              ref={videoRef}
              src={resolvedUrl}
              controls
              playsInline
              loop
              preload="metadata"
              className="max-w-full max-h-[88vh] w-auto h-auto object-contain rounded-xl shadow-2xl border border-white/10 bg-black"
              onDoubleClick={toggleBrowserFullscreen}
              onError={(e) => {
                const target = e.currentTarget;
                const src = target.currentSrc || target.src;
                if (src) {
                  setTimeout(() => {
                    const clean = src.split('?')[0];
                    target.src = `${clean}?retry=${Date.now()}`;
                    target.load();
                  }, 1200);
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Bottom helper hint */}
      <div className="py-2 text-center text-xs text-white/40 pointer-events-none">
        {mediaType === 'image'
          ? 'Click image to zoom • Click outside or press Esc to close'
          : 'Double-click video for full display • Click outside or press Esc to close'}
      </div>
    </div>
  );
};
