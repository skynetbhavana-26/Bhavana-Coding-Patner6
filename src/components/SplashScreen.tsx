import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import codingPartnerLogo from '../assets/image.png';

interface SplashScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, onSkip }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 400);
          return 100;
        }
        return prev + 2;
      });
    }, 45);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="relative w-full h-full min-h-[720px] bg-[#07090e] text-white flex flex-col justify-between items-center py-6 px-4 overflow-hidden select-none">
      {/* Background ambient liquid glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-72 h-72 bg-cyan-500/20 rounded-full blur-[90px] pointer-events-none" />

      {/* Top Section: Single-row "Coding Partner" text with clean minimal subtitle (no sparkles) */}
      <div className="w-full flex flex-col items-center pt-8 z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center w-full flex flex-col items-center"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm whitespace-nowrap text-center">
            Coding Partner
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mt-3 text-xs md:text-sm font-light tracking-[0.25em] text-slate-300/80 uppercase text-center"
          >
            Connect. Collaborate. Create.
          </motion.p>
        </motion.div>
      </div>

      {/* Center Exact Uploaded Coding Partner Mascot Logo */}
      <div className="relative flex flex-col items-center justify-center my-auto z-10 w-full px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative flex flex-col items-center justify-center"
        >
          <img
            id="splash-screen-logo"
            src={codingPartnerLogo || '/image.png'}
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== window.location.origin + '/image.png') {
                target.src = '/image.png';
              }
            }}
            alt="Coding Partner Mascot Logo"
            referrerPolicy="no-referrer"
            className="w-56 sm:w-64 md:w-72 max-w-[80vw] h-auto object-contain select-none pointer-events-none mx-auto block drop-shadow-[0_20px_45px_rgba(79,70,229,0.35)]"
          />
        </motion.div>
      </div>

      {/* Bottom Liquid Glass Loading Bar */}
      <div className="w-full max-w-xs flex flex-col items-center pb-8 z-10">
        {/* iOS Liquid Glass Progress Capsule */}
        <div className="w-full h-7 rounded-full p-1 bg-white/5 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)] relative overflow-hidden">
          <motion.div
            style={{ width: `${progress}%` }}
            className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.7)] relative"
          >
            {/* Liquid specular shine effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-full" />
          </motion.div>
        </div>

        {/* Quick Skip button */}
        <button
          onClick={onSkip}
          className="mt-3 px-4 py-1 text-[11px] uppercase tracking-widest text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          Skip to App →
        </button>
      </div>

      {/* iOS Home Indicator */}
      <div className="w-32 h-1 bg-white/30 rounded-full mx-auto" />
    </div>
  );
};
