import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import slide1Illustration from '../assets/images/onboarding_developers_1788600910580.jpg';
import slide2Illustration from '../assets/images/onboard_slide_collab_1788601725153.jpg';
import slide3Illustration from '../assets/images/onboard_slide_launch_1788601754398.jpg';

interface OnboardingScreenProps {
  onGetStarted: () => void;
  onLoginClick: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onGetStarted, onLoginClick }) => {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      prefix: 'Find Your',
      highlight: 'Coding Partner',
      subtitle: 'Connect with developers, collaborate on projects and build amazing things together.',
      image: slide1Illustration,
      fallback: '/onboarding_developers.jpg',
      alt: 'Find Your Coding Partner - Developers with Laptops and Glowing Orb',
    },
    {
      prefix: 'Real-Time',
      highlight: 'Code Collaboration',
      subtitle: 'Brainstorm architectures, share code snippets, and build real-time developer momentum.',
      image: slide2Illustration,
      fallback: '/onboarding_collab.jpg',
      alt: 'Real-Time Code Collaboration - Developers Working Together on Code',
    },
    {
      prefix: 'Build & Ship',
      highlight: 'World-Class Apps',
      subtitle: 'Assemble your sprint dream team, track milestones, and scale your creations together.',
      image: slide3Illustration,
      fallback: '/onboarding_launch.jpg',
      alt: 'Build & Ship World-Class Apps - Developers Celebrating Launch',
    },
  ];

  const current = slides[activeSlide];

  const handleNext = () => {
    if (activeSlide < slides.length - 1) {
      setActiveSlide((prev) => prev + 1);
    } else {
      onGetStarted();
    }
  };

  return (
    <div className="relative w-full h-full min-h-[720px] bg-[#000000] text-white flex flex-col justify-between items-center py-6 px-5 overflow-hidden select-none">
      {/* Deep space stardust ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-88 h-88 bg-purple-600/15 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-600/12 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle top bar with Sign In option */}
      <div className="w-full flex justify-end pt-2 px-1 z-20">
        <button
          onClick={onLoginClick}
          className="text-[11px] uppercase tracking-wider text-slate-400 hover:text-white px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md transition-colors cursor-pointer"
        >
          Sign In
        </button>
      </div>

      {/* TOP SECTION: Matches exact reference typography */}
      <div className="w-full flex flex-col items-center text-center z-10 pt-2 px-2 max-w-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex flex-col items-center text-center w-full"
          >
            <h1 className="font-serif text-2xl sm:text-3xl text-slate-100 font-normal tracking-tight">
              {current.prefix}
            </h1>
            <span className="font-serif font-medium text-3xl sm:text-4xl md:text-5xl bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(168,85,247,0.35)] mt-1">
              {current.highlight}
            </span>
            <p className="text-xs sm:text-sm text-slate-300/85 font-light leading-relaxed text-center max-w-[285px] sm:max-w-xs mx-auto mt-3.5 sm:mt-4">
              {current.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CENTER SECTION: Cartoon developer characters with unique poses per slide */}
      <div className="relative my-auto flex flex-col items-center justify-center z-10 w-full max-w-sm px-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="relative flex items-center justify-center w-full"
          >
            {/* Subtle concentric ambient violet back-glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/20 via-indigo-500/10 to-transparent rounded-full blur-2xl pointer-events-none transform scale-90" />

            <img
              src={current.image || current.fallback}
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== window.location.origin + current.fallback) {
                  target.src = current.fallback;
                }
              }}
              alt={current.alt}
              referrerPolicy="no-referrer"
              className="w-full max-w-[310px] sm:max-w-[350px] aspect-square object-contain rounded-2xl select-none pointer-events-none drop-shadow-[0_15px_35px_rgba(147,51,234,0.3)] relative z-10"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* BOTTOM SECTION: 3 Dots + Liquid Glowing "Get Started ->" Button */}
      <div className="w-full max-w-xs flex flex-col items-center pb-6 z-10 space-y-5">
        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-2.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === activeSlide
                  ? 'w-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_12px_rgba(168,85,247,0.9)]'
                  : 'w-2.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        {/* Liquid Glass Pill Button matching reference */}
        <button
          onClick={handleNext}
          className="w-full py-3.5 sm:py-4 px-6 rounded-full bg-gradient-to-r from-[#180a3a]/90 via-[#1d1650]/90 to-[#122359]/90 hover:from-[#230f54] hover:to-[#172d70] border border-purple-400/40 shadow-[0_0_28px_rgba(147,51,234,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)] backdrop-blur-xl flex items-center justify-between transition-all transform active:scale-[0.98] cursor-pointer"
        >
          <span className="flex-1 text-center font-medium text-base sm:text-lg text-white tracking-wide pl-5">
            Get Started
          </span>
          <ArrowRight className="w-5 h-5 text-white shrink-0" />
        </button>

        {/* iOS Home Indicator */}
        <div className="w-32 h-1 bg-white/25 rounded-full mx-auto mt-2" />
      </div>
    </div>
  );
};
