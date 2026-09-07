import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Activity, Star, ChevronDown } from 'lucide-react';

interface TeamProgressGraphCardProps {
  timeframeText?: string;
  onTimeframeChange?: (timeframe: string) => void;
  className?: string;
  hideStats?: boolean;
  isMobileView?: boolean;
}

export const TeamProgressGraphCard: React.FC<TeamProgressGraphCardProps> = ({
  timeframeText = 'This Week',
  onTimeframeChange,
  className = '',
  hideStats = false,
  isMobileView,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframeText);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [windowWidth, setWindowWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Strict mobile detection:
  // 1. Explicit isMobileView prop (e.g. from isDeviceFrame phone view)
  // 2. Container width < 600px (phone frame or mobile device viewport)
  // 3. Window viewport width < 768px
  const isMobile =
    isMobileView !== undefined
      ? isMobileView
      : (containerWidth > 0 ? containerWidth < 600 : false) || windowWidth < 768;

  // Exact data from image.png:
  // Days: MON, TUE, WED, THU, FRI, SAT, SUN
  // Values: 40%, 65%, 30%, 80%, 55%, 90%, 70%
  const weekData = [
    {
      day: 'MON',
      pct: 40,
      avatarY: 185,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      name: 'Arjun',
    },
    {
      day: 'TUE',
      pct: 65,
      avatarY: 130,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
      name: 'Aisha',
    },
    {
      day: 'WED',
      pct: 30,
      avatarY: 210,
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
      name: 'Karthik',
    },
    {
      day: 'THU',
      pct: 80,
      avatarY: 95,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      name: 'Pooja',
    },
    {
      day: 'FRI',
      pct: 55,
      avatarY: 150,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      name: 'Dev',
    },
    {
      day: 'SAT',
      pct: 90,
      avatarY: 75,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
      name: 'Sneha',
    },
    {
      day: 'SUN',
      pct: 70,
      avatarY: 125,
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
      name: 'Rahul',
    },
  ];

  // SVG coordinate dimensions precisely proportioned to match image.png
  const svgWidth = 960;
  const svgHeight = 440;
  const graphLeft = 95;
  const graphRight = 905;
  const graphTop = 110;    // 100%
  const graphBottom = 370; // 0%
  const graphHeight = graphBottom - graphTop; // 260px

  const yAxisTicks = [
    { label: '100', y: graphTop },
    { label: '75', y: graphTop + graphHeight * 0.25 },
    { label: '50', y: graphTop + graphHeight * 0.5 },
    { label: '25', y: graphTop + graphHeight * 0.75 },
    { label: '0', y: graphBottom },
  ];

  const step = (graphRight - graphLeft) / (weekData.length - 1); // 135px

  const points = weekData.map((d, i) => {
    const x = graphLeft + i * step;
    const y = graphBottom - (d.pct / 100) * graphHeight;
    return { ...d, x, y };
  });

  // Calculate smooth cubic bezier curve
  const curvePath = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[i - 1];
    const dx = pt.x - prev.x;
    const cx1 = prev.x + dx * 0.45;
    const cy1 = prev.y;
    const cx2 = pt.x - dx * 0.45;
    const cy2 = pt.y;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
  }, '');

  // Gradient area under curve down to 0% baseline
  const areaPath = points.length > 0
    ? `${curvePath} L ${points[points.length - 1].x} ${graphBottom} L ${points[0].x} ${graphBottom} Z`
    : '';

  const avatarRadius = 24;

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-[28px] sm:rounded-[36px] bg-[#0c0e1a]/95 backdrop-blur-2xl border border-white/20 p-4 sm:p-6 md:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_40px_rgba(168,85,247,0.18),inset_0_1px_2px_rgba(255,255,255,0.25)] text-white space-y-4 sm:space-y-6 relative overflow-hidden ${className}`}
    >
      {/* Soft ambient violet background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header: Neatly fitted in one row -> [Icon] Project Team Updates [This Week ▼] */}
      <div className="flex items-center justify-between gap-2.5 sm:gap-4 relative z-10 px-1 w-full">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Rounded square badge with glossy glass background & line-graph icon */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/[0.04] border border-white/15 backdrop-blur-md flex items-center justify-center shadow-inner shadow-white/5 shrink-0">
            <svg
              className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-purple-300 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 16 8 10 13 15 21 6" />
              <circle cx="3" cy="16" r="1.5" fill="currentColor" />
              <circle cx="8" cy="10" r="1.5" fill="currentColor" />
              <circle cx="13" cy="15" r="1.5" fill="currentColor" />
              <circle cx="21" cy="6" r="1.5" fill="currentColor" />
            </svg>
          </div>

          <h2 className="text-xs sm:text-sm md:text-base font-serif font-bold uppercase tracking-wider text-white whitespace-nowrap truncate">
            Project Team Updates
          </h2>
        </div>

        {/* Timeframe Dropdown Pill */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl sm:rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-xs text-slate-200 font-medium transition-all cursor-pointer shadow-sm whitespace-nowrap"
          >
            <span>{selectedTimeframe}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute right-0 top-full mt-1.5 py-1 px-1 rounded-xl bg-[#12162a] border border-white/20 shadow-2xl z-30 min-w-[120px] backdrop-blur-xl"
              >
                {['This Week', 'Last Week', 'Sprint Cycle', 'Monthly'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSelectedTimeframe(opt);
                      setShowDropdown(false);
                      onTimeframeChange?.(opt);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      selectedTimeframe === opt
                        ? 'bg-purple-600/40 text-purple-200 font-semibold'
                        : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Graph Area: Exact SVG implementation matching image.png */}
      <div className="w-full relative overflow-x-auto no-scrollbar">
        <div className="w-full min-w-[340px]">
          <svg
            className="w-full h-auto block overflow-visible"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Neon Purple/Pink Gradient Line */}
              <linearGradient id="neonPurpleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>

              {/* Soft purple glow under curve */}
              <linearGradient id="neonAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25" />
                <stop offset="70%" stopColor="#6366f1" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#080912" stopOpacity="0.0" />
              </linearGradient>

              {/* Intense purple glow filter for line and nodes */}
              <filter id="purpleGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#c084fc" floodOpacity="0.85" />
              </filter>

              {/* Avatar circular halo neon filter */}
              <filter id="avatarHaloGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="#a855f7" floodOpacity="0.95" />
              </filter>

              {/* Text glow */}
              <filter id="textGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#c084fc" floodOpacity="0.75" />
              </filter>

              {/* ClipPaths for each avatar */}
              {points.map((pt, idx) => (
                <clipPath key={`clip-${idx}`} id={`avatar-clip-${idx}`}>
                  <circle cx={pt.x} cy={pt.avatarY} r={avatarRadius} />
                </clipPath>
              ))}
            </defs>

            {/* Y-Axis Header Label: PROGRESS (%) placed above the 100 tick */}
            <text
              x="80"
              y="94"
              fill="#94a3b8"
              fontSize="10"
              fontWeight="700"
              letterSpacing="1.2"
              textAnchor="end"
              fontFamily="sans-serif"
            >
              PROGRESS (%)
            </text>

            {/* Horizontal Dashed Grid Lines & Numeric Ticks (100, 75, 50, 25, 0) */}
            {yAxisTicks.map((tick) => (
              <g key={tick.label}>
                <text
                  x="76"
                  y={tick.y + 3.5}
                  fill="#64748b"
                  fontSize="11"
                  fontWeight="500"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {tick.label}
                </text>
                <line
                  x1={graphLeft - 10}
                  y1={tick.y}
                  x2={graphRight + 20}
                  y2={tick.y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeDasharray="4 4"
                />
              </g>
            ))}

            {/* Vertical Dashed Grid Lines for Each Day Column */}
            {points.map((pt) => (
              <line
                key={`vert-${pt.day}`}
                x1={pt.x}
                y1={graphTop}
                x2={pt.x}
                y2={graphBottom + 4}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="3 4"
              />
            ))}

            {/* Filled Area Under Neon Curve */}
            {areaPath && <path d={areaPath} fill="url(#neonAreaGrad)" />}

            {/* The Main Glowing Spline Curve */}
            <path
              d={curvePath}
              fill="none"
              stroke="url(#neonPurpleGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#purpleGlow)"
            />

            {/* Data Points, Dashed Connectors, Halo Avatars, and Labels */}
            {points.map((pt, idx) => {
              return (
                <g key={`point-group-${pt.day}`}>
                  {/* Vertical dashed guide line from avatar pointer tip to node on curve */}
                  <line
                    x1={pt.x}
                    y1={pt.avatarY + avatarRadius + 6}
                    x2={pt.x}
                    y2={pt.y}
                    stroke="rgba(255,255,255,0.55)"
                    strokeDasharray="3 3"
                    strokeWidth="1.2"
                  />

                  {/* Outer glow ring around node on curve */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="7.5"
                    fill="#a855f7"
                    opacity="0.8"
                    filter="url(#purpleGlow)"
                  />

                  {/* Center crisp dot on curve */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#ffffff"
                    stroke="#a855f7"
                    strokeWidth="2.5"
                  />

                  {/* Percentage text label under the node */}
                  <text
                    x={pt.x}
                    y={pt.y + 20}
                    fill="#c084fc"
                    fontSize="11.5"
                    fontWeight="700"
                    fontFamily="monospace"
                    textAnchor="middle"
                    filter="url(#textGlow)"
                  >
                    {pt.pct}%
                  </text>

                  {/* X-Axis Day Label mathematically centered under each node */}
                  <text
                    x={pt.x}
                    y={graphBottom + 26}
                    fill="#94a3b8"
                    fontSize="11.5"
                    fontWeight="600"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {pt.day}
                  </text>

                  {/* Avatar Circular Glow Halo */}
                  <circle
                    cx={pt.x}
                    cy={pt.avatarY}
                    r={avatarRadius + 1.5}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="3"
                    filter="url(#avatarHaloGlow)"
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.avatarY}
                    r={avatarRadius + 0.5}
                    fill="none"
                    stroke="#e9d5ff"
                    strokeWidth="1"
                  />

                  {/* Avatar Photo clipped to circle */}
                  <image
                    href={pt.avatar}
                    x={pt.x - avatarRadius}
                    y={pt.avatarY - avatarRadius}
                    width={avatarRadius * 2}
                    height={avatarRadius * 2}
                    clipPath={`url(#avatar-clip-${idx})`}
                    preserveAspectRatio="xMidYMid slice"
                  />

                  {/* Downward triangle pointer notch */}
                  <polygon
                    points={`${pt.x - 4},${pt.avatarY + avatarRadius} ${pt.x + 4},${pt.avatarY + avatarRadius} ${pt.x},${pt.avatarY + avatarRadius + 6}`}
                    fill="#c084fc"
                    filter="url(#purpleGlow)"
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Bottom Row: 3 Liquid Glass Stat Cards
          - Visible ONLY in Desktop / Full view
          - Completely REMOVED in Mobile view
          - Hidden if hideStats is true */}
      {!hideStats && !isMobile && (
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 pt-1">
          {/* Card 1: 7 MEMBERS Active Contributors */}
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-3 shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/15 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-slate-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-bold text-white leading-none">7</span>
                <span className="text-[10px] sm:text-[11px] text-white font-bold tracking-wider uppercase">
                  MEMBERS
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate mt-0.5">Active Contributors</p>
            </div>
          </div>

          {/* Card 2: 68% Average Progress */}
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-3 shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/15 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-slate-200" />
            </div>
            <div className="min-w-0">
              <span className="text-base sm:text-lg font-bold text-white leading-none block">68%</span>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate mt-0.5">Average Progress</p>
            </div>
          </div>

          {/* Card 3: 24 Tasks Completed */}
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-3 shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/15 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-slate-200" />
            </div>
            <div className="min-w-0">
              <span className="text-base sm:text-lg font-bold text-white leading-none block">24</span>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate mt-0.5">Tasks Completed</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
