import React from 'react';

// Custom illustration components inspired by unDraw/Storyset
// Theme: Scheduling, productivity, Colby college

interface IllustrationProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

// Professional SVG Icons to replace emojis
export const StatIcons = {
  Calendar: ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <rect x="7" y="14" width="3" height="3" rx="0.5" fill={color} />
    </svg>
  ),

  CheckCircle: ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),

  Clock: ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),

  Users: ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),

  MapPin: ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),

  BarChart: ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),

  AlertCircle: ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),

  Zap: ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),

  Star: ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),

  TrendingUp: ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),

  Box: ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),

  Settings: ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),

  Refresh: ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),

  Play: ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      stroke="none"
      className={className}
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
};

// Scheduling / Calendar illustration
export const ScheduleIllustration: React.FC<IllustrationProps> = ({
  width = 240,
  height = 200,
  className = '',
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 400 300"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background shapes */}
    <ellipse cx="200" cy="270" rx="150" ry="20" fill="#E0F2FE" opacity="0.6" />

    {/* Calendar base */}
    <rect
      x="80"
      y="60"
      width="240"
      height="180"
      rx="16"
      fill="white"
      stroke="#E5E7EB"
      strokeWidth="2"
    />
    <rect x="80" y="60" width="240" height="45" rx="16" fill="#002169" />
    <rect x="80" y="90" width="240" height="15" fill="#002169" />

    {/* Calendar header decorations */}
    <circle cx="120" cy="82" r="8" fill="#C9A227" />
    <circle cx="150" cy="82" r="8" fill="#C9A227" />
    <circle cx="180" cy="82" r="8" fill="#C9A227" />

    {/* Calendar rings */}
    <rect x="110" y="50" width="8" height="24" rx="4" fill="#6B7280" />
    <rect x="160" y="50" width="8" height="24" rx="4" fill="#6B7280" />
    <rect x="230" y="50" width="8" height="24" rx="4" fill="#6B7280" />
    <rect x="280" y="50" width="8" height="24" rx="4" fill="#6B7280" />

    {/* Calendar grid cells */}
    <rect x="95" y="115" width="45" height="35" rx="6" fill="#D1FAE5" />
    <rect x="150" y="115" width="45" height="35" rx="6" fill="#E0F2FE" />
    <rect x="205" y="115" width="45" height="35" rx="6" fill="#FEF3C7" />
    <rect x="260" y="115" width="45" height="35" rx="6" fill="#EDE9FE" />

    <rect x="95" y="160" width="45" height="35" rx="6" fill="#FCE7F3" />
    <rect x="150" y="160" width="45" height="35" rx="6" fill="#D1FAE5" />
    <rect x="205" y="160" width="45" height="35" rx="6" fill="#E0F2FE" />
    <rect x="260" y="160" width="45" height="35" rx="6" fill="#CFFAFE" />

    <rect x="95" y="200" width="45" height="30" rx="6" fill="#FEF3C7" />
    <rect x="150" y="200" width="45" height="30" rx="6" fill="#FFE4E6" />
    <rect x="205" y="200" width="45" height="30" rx="6" fill="#D1FAE5" />
    <rect x="260" y="200" width="45" height="30" rx="6" fill="#E0E7FF" />

    {/* Checkmarks */}
    <path
      d="M110 130 L118 138 L130 122"
      stroke="#059669"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M165 130 L173 138 L185 122"
      stroke="#0284C7"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M275 175 L283 183 L295 167"
      stroke="#0891B2"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Person figure */}
    <circle cx="340" cy="180" r="25" fill="#002169" />
    <ellipse cx="340" cy="250" rx="25" ry="35" fill="#002169" />
    <circle cx="340" cy="180" r="18" fill="#E8D5B7" />
    <circle cx="335" cy="176" r="3" fill="#002169" />
    <circle cx="345" cy="176" r="3" fill="#002169" />
    <path d="M335 186 Q340 190 345 186" stroke="#002169" strokeWidth="2" strokeLinecap="round" />

    {/* Person arm pointing */}
    <ellipse cx="315" cy="230" rx="8" ry="30" fill="#002169" transform="rotate(-30 315 230)" />
    <circle cx="295" cy="205" r="10" fill="#E8D5B7" />

    {/* Floating elements */}
    <circle cx="60" cy="100" r="12" fill="#7DD3FC" opacity="0.6" />
    <circle cx="350" cy="80" r="8" fill="#6EE7B7" opacity="0.6" />
    <circle cx="45" cy="180" r="6" fill="#FDA4AF" opacity="0.6" />

    {/* Stars */}
    <path
      d="M370 120 L372 126 L378 126 L373 130 L375 136 L370 132 L365 136 L367 130 L362 126 L368 126 Z"
      fill="#FDE68A"
    />
    <path
      d="M55 140 L56 144 L60 144 L57 147 L58 151 L55 148 L52 151 L53 147 L50 144 L54 144 Z"
      fill="#C4B5FD"
    />
  </svg>
);

// Team/Workers illustration
export const TeamIllustration: React.FC<IllustrationProps> = ({
  width = 240,
  height = 200,
  className = '',
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 400 300"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background */}
    <ellipse cx="200" cy="270" rx="160" ry="25" fill="#E0F2FE" opacity="0.5" />

    {/* Center person (main) */}
    <circle cx="200" cy="140" r="45" fill="#002169" />
    <circle cx="200" cy="140" r="35" fill="#E8D5B7" />
    <circle cx="190" cy="135" r="5" fill="#002169" />
    <circle cx="210" cy="135" r="5" fill="#002169" />
    <path d="M190 150 Q200 158 210 150" stroke="#002169" strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="200" cy="230" rx="35" ry="45" fill="#002169" />

    {/* Left person */}
    <circle cx="80" cy="160" r="35" fill="#7DD3FC" />
    <circle cx="80" cy="160" r="28" fill="#E8D5B7" />
    <circle cx="72" cy="156" r="4" fill="#0284C7" />
    <circle cx="88" cy="156" r="4" fill="#0284C7" />
    <path d="M72 168 Q80 174 88 168" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
    <ellipse cx="80" cy="235" rx="28" ry="38" fill="#7DD3FC" />

    {/* Right person */}
    <circle cx="320" cy="160" r="35" fill="#6EE7B7" />
    <circle cx="320" cy="160" r="28" fill="#E8D5B7" />
    <circle cx="312" cy="156" r="4" fill="#059669" />
    <circle cx="328" cy="156" r="4" fill="#059669" />
    <path d="M312 168 Q320 174 328 168" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
    <ellipse cx="320" cy="235" rx="28" ry="38" fill="#6EE7B7" />

    {/* Connection lines */}
    <path
      d="M115 170 Q160 120 165 145"
      stroke="#C4B5FD"
      strokeWidth="3"
      strokeLinecap="round"
      strokeDasharray="8 4"
    />
    <path
      d="M285 170 Q240 120 235 145"
      stroke="#FDA4AF"
      strokeWidth="3"
      strokeLinecap="round"
      strokeDasharray="8 4"
    />
    <path
      d="M80 195 Q200 260 320 195"
      stroke="#FDE68A"
      strokeWidth="3"
      strokeLinecap="round"
      strokeDasharray="8 4"
    />

    {/* Floating badges */}
    <circle cx="200" cy="85" r="20" fill="#C9A227" />
    <text x="200" y="92" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
      ★
    </text>

    {/* Small decorations */}
    <circle cx="50" cy="100" r="8" fill="#FDA4AF" opacity="0.6" />
    <circle cx="350" cy="90" r="10" fill="#FDE68A" opacity="0.6" />
    <circle cx="140" cy="70" r="6" fill="#C4B5FD" opacity="0.6" />
    <circle cx="260" cy="65" r="7" fill="#7DD3FC" opacity="0.6" />
  </svg>
);

// Empty state illustration
export const EmptyStateIllustration: React.FC<IllustrationProps> = ({
  width = 200,
  height = 160,
  className = '',
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 300 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background */}
    <ellipse cx="150" cy="220" rx="100" ry="15" fill="#E0F2FE" opacity="0.5" />

    {/* Empty box */}
    <path
      d="M75 100 L150 60 L225 100 L225 180 L150 220 L75 180 Z"
      fill="white"
      stroke="#E5E7EB"
      strokeWidth="2"
    />
    <path d="M75 100 L150 140 L225 100" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="2" />
    <path d="M150 140 L150 220" stroke="#E5E7EB" strokeWidth="2" />

    {/* Box flaps */}
    <path d="M75 100 L110 80 L150 60" stroke="#E5E7EB" strokeWidth="2" fill="#FAFCFF" />
    <path d="M225 100 L190 80 L150 60" stroke="#E5E7EB" strokeWidth="2" fill="#FAFCFF" />

    {/* Sparkles */}
    <circle cx="100" cy="50" r="6" fill="#7DD3FC" opacity="0.6" />
    <circle cx="200" cy="45" r="8" fill="#6EE7B7" opacity="0.6" />
    <circle cx="250" cy="130" r="5" fill="#FDA4AF" opacity="0.6" />
    <circle cx="50" cy="150" r="7" fill="#FDE68A" opacity="0.6" />

    {/* Question mark or dots */}
    <circle cx="150" cy="130" r="8" fill="#C4B5FD" />
    <circle cx="130" cy="130" r="8" fill="#7DD3FC" />
    <circle cx="170" cy="130" r="8" fill="#FDA4AF" />
  </svg>
);

// Success/Achievement illustration
export const SuccessIllustration: React.FC<IllustrationProps> = ({
  width = 200,
  height = 160,
  className = '',
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 300 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background */}
    <ellipse cx="150" cy="220" rx="100" ry="15" fill="#D1FAE5" opacity="0.5" />

    {/* Trophy base */}
    <rect x="120" y="180" width="60" height="20" rx="4" fill="#C9A227" />
    <rect x="130" y="160" width="40" height="25" fill="#C9A227" />

    {/* Trophy cup */}
    <path d="M100 80 Q100 140 150 150 Q200 140 200 80 Z" fill="#C9A227" />
    <path d="M110 90 Q110 130 150 138 Q190 130 190 90 Z" fill="#FDE68A" />

    {/* Trophy handles */}
    <path
      d="M100 90 Q70 90 70 110 Q70 130 100 130"
      stroke="#C9A227"
      strokeWidth="8"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M200 90 Q230 90 230 110 Q230 130 200 130"
      stroke="#C9A227"
      strokeWidth="8"
      fill="none"
      strokeLinecap="round"
    />

    {/* Star on trophy */}
    <path
      d="M150 95 L156 110 L172 112 L160 122 L163 138 L150 130 L137 138 L140 122 L128 112 L144 110 Z"
      fill="white"
    />

    {/* Confetti */}
    <rect x="60" y="50" width="12" height="8" rx="2" fill="#FDA4AF" transform="rotate(15 66 54)" />
    <rect
      x="230"
      y="45"
      width="10"
      height="6"
      rx="2"
      fill="#7DD3FC"
      transform="rotate(-20 235 48)"
    />
    <rect x="85" y="35" width="8" height="12" rx="2" fill="#C4B5FD" transform="rotate(30 89 41)" />
    <rect
      x="205"
      y="60"
      width="12"
      height="6"
      rx="2"
      fill="#6EE7B7"
      transform="rotate(-10 211 63)"
    />

    {/* Stars */}
    <path
      d="M70 80 L72 86 L78 86 L73 90 L75 96 L70 92 L65 96 L67 90 L62 86 L68 86 Z"
      fill="#FDE68A"
    />
    <path
      d="M240 75 L242 81 L248 81 L243 85 L245 91 L240 87 L235 91 L237 85 L232 81 L238 81 Z"
      fill="#FDA4AF"
    />
  </svg>
);

// Focus/Productivity illustration (for focus panel) - Clean scheduling theme
export const FocusModeIllustration: React.FC<IllustrationProps> = ({
  width = 200,
  height = 150,
  className = '',
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 300 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background elements */}
    <ellipse cx="150" cy="180" rx="120" ry="15" fill="white" opacity="0.1" />

    {/* Calendar/Schedule board */}
    <rect x="60" y="30" width="180" height="130" rx="12" fill="white" opacity="0.15" />
    <rect x="60" y="30" width="180" height="30" rx="12" fill="white" opacity="0.2" />
    <rect x="60" y="48" width="180" height="12" fill="white" opacity="0.2" />

    {/* Calendar grid lines */}
    <line x1="105" y1="60" x2="105" y2="160" stroke="white" strokeWidth="1" opacity="0.1" />
    <line x1="150" y1="60" x2="150" y2="160" stroke="white" strokeWidth="1" opacity="0.1" />
    <line x1="195" y1="60" x2="195" y2="160" stroke="white" strokeWidth="1" opacity="0.1" />
    <line x1="60" y1="95" x2="240" y2="95" stroke="white" strokeWidth="1" opacity="0.1" />
    <line x1="60" y1="130" x2="240" y2="130" stroke="white" strokeWidth="1" opacity="0.1" />

    {/* Schedule blocks */}
    <rect x="68" y="68" width="30" height="20" rx="4" fill="#6EE7B7" opacity="0.8" />
    <rect x="113" y="68" width="30" height="20" rx="4" fill="#7DD3FC" opacity="0.8" />
    <rect x="158" y="100" width="30" height="22" rx="4" fill="#FDA4AF" opacity="0.8" />
    <rect x="203" y="100" width="30" height="22" rx="4" fill="#C4B5FD" opacity="0.8" />
    <rect x="68" y="135" width="30" height="18" rx="4" fill="#FDE68A" opacity="0.8" />
    <rect x="158" y="135" width="30" height="18" rx="4" fill="#6EE7B7" opacity="0.8" />

    {/* Checkmarks on blocks */}
    <path
      d="M78 75 L82 79 L88 71"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M123 75 L127 79 L133 71"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Clock icon */}
    <circle cx="255" cy="55" r="20" fill="white" opacity="0.2" />
    <circle cx="255" cy="55" r="15" fill="white" opacity="0.15" />
    <line
      x1="255"
      y1="55"
      x2="255"
      y2="45"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.6"
    />
    <line
      x1="255"
      y1="55"
      x2="262"
      y2="58"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.6"
    />

    {/* Floating elements */}
    <circle cx="45" cy="80" r="8" fill="#6EE7B7" opacity="0.4" />
    <circle cx="265" cy="130" r="6" fill="#FDA4AF" opacity="0.4" />
    <circle cx="35" cy="140" r="5" fill="#7DD3FC" opacity="0.3" />

    {/* Stars/sparkles */}
    <path
      d="M50 50 L52 56 L58 56 L53 60 L55 66 L50 62 L45 66 L47 60 L42 56 L48 56 Z"
      fill="white"
      opacity="0.5"
    />
    <path
      d="M270 90 L271 94 L275 94 L272 97 L273 101 L270 98 L267 101 L268 97 L265 94 L269 94 Z"
      fill="white"
      opacity="0.4"
    />
  </svg>
);

// Availability/Time illustration
export const AvailabilityIllustration: React.FC<IllustrationProps> = ({
  width = 240,
  height = 200,
  className = '',
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 400 300"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background */}
    <ellipse cx="200" cy="270" rx="150" ry="20" fill="#D1FAE5" opacity="0.5" />

    {/* Large clock */}
    <circle cx="200" cy="140" r="100" fill="white" stroke="#E5E7EB" strokeWidth="3" />
    <circle cx="200" cy="140" r="90" fill="white" />

    {/* Clock face decorations */}
    <circle cx="200" cy="140" r="85" fill="none" stroke="#F3F4F6" strokeWidth="2" />

    {/* Hour markers */}
    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
      <line
        key={i}
        x1={200 + 70 * Math.cos(((angle - 90) * Math.PI) / 180)}
        y1={140 + 70 * Math.sin(((angle - 90) * Math.PI) / 180)}
        x2={200 + 80 * Math.cos(((angle - 90) * Math.PI) / 180)}
        y2={140 + 80 * Math.sin(((angle - 90) * Math.PI) / 180)}
        stroke={i % 3 === 0 ? '#002169' : '#CBD5E1'}
        strokeWidth={i % 3 === 0 ? 3 : 2}
        strokeLinecap="round"
      />
    ))}

    {/* Clock hands */}
    <line
      x1="200"
      y1="140"
      x2="200"
      y2="85"
      stroke="#002169"
      strokeWidth="6"
      strokeLinecap="round"
    />
    <line
      x1="200"
      y1="140"
      x2="240"
      y2="120"
      stroke="#002169"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <line
      x1="200"
      y1="140"
      x2="180"
      y2="160"
      stroke="#C9A227"
      strokeWidth="2"
      strokeLinecap="round"
    />

    {/* Center dot */}
    <circle cx="200" cy="140" r="8" fill="#002169" />
    <circle cx="200" cy="140" r="4" fill="#C9A227" />

    {/* Availability blocks around clock */}
    <rect
      x="320"
      y="80"
      width="50"
      height="25"
      rx="6"
      fill="#D1FAE5"
      stroke="#6EE7B7"
      strokeWidth="2"
    />
    <text x="345" y="97" textAnchor="middle" fill="#059669" fontSize="12" fontWeight="bold">
      ✓
    </text>

    <rect
      x="320"
      y="115"
      width="50"
      height="25"
      rx="6"
      fill="#D1FAE5"
      stroke="#6EE7B7"
      strokeWidth="2"
    />
    <text x="345" y="132" textAnchor="middle" fill="#059669" fontSize="12" fontWeight="bold">
      ✓
    </text>

    <rect
      x="320"
      y="150"
      width="50"
      height="25"
      rx="6"
      fill="#FEF3C7"
      stroke="#FDE68A"
      strokeWidth="2"
    />
    <text x="345" y="167" textAnchor="middle" fill="#D97706" fontSize="12" fontWeight="bold">
      ?
    </text>

    <rect
      x="30"
      y="100"
      width="50"
      height="25"
      rx="6"
      fill="#FFE4E6"
      stroke="#FDA4AF"
      strokeWidth="2"
    />
    <text x="55" y="117" textAnchor="middle" fill="#E11D48" fontSize="12" fontWeight="bold">
      ✗
    </text>

    <rect
      x="30"
      y="135"
      width="50"
      height="25"
      rx="6"
      fill="#D1FAE5"
      stroke="#6EE7B7"
      strokeWidth="2"
    />
    <text x="55" y="152" textAnchor="middle" fill="#059669" fontSize="12" fontWeight="bold">
      ✓
    </text>

    {/* Decorative elements */}
    <circle cx="100" cy="60" r="10" fill="#7DD3FC" opacity="0.5" />
    <circle cx="300" cy="50" r="8" fill="#C4B5FD" opacity="0.5" />
    <circle cx="350" cy="200" r="12" fill="#FDA4AF" opacity="0.4" />
  </svg>
);

// Settings/Config illustration
export const SettingsIllustration: React.FC<IllustrationProps> = ({
  width = 200,
  height = 160,
  className = '',
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 300 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background */}
    <ellipse cx="150" cy="220" rx="100" ry="15" fill="#E0E7FF" opacity="0.5" />

    {/* Main gear */}
    <circle cx="150" cy="120" r="50" fill="#002169" />
    <circle cx="150" cy="120" r="35" fill="white" />
    <circle cx="150" cy="120" r="20" fill="#002169" />

    {/* Gear teeth */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
      <rect
        key={i}
        x="140"
        y="60"
        width="20"
        height="25"
        rx="4"
        fill="#002169"
        transform={`rotate(${angle} 150 120)`}
      />
    ))}

    {/* Smaller gear */}
    <circle cx="230" cy="90" r="30" fill="#C9A227" />
    <circle cx="230" cy="90" r="20" fill="white" />
    <circle cx="230" cy="90" r="12" fill="#C9A227" />

    {/* Small gear teeth */}
    {[0, 60, 120, 180, 240, 300].map((angle, i) => (
      <rect
        key={i}
        x="224"
        y="55"
        width="12"
        height="15"
        rx="3"
        fill="#C9A227"
        transform={`rotate(${angle} 230 90)`}
      />
    ))}

    {/* Another small gear */}
    <circle cx="80" cy="160" r="25" fill="#7DD3FC" />
    <circle cx="80" cy="160" r="16" fill="white" />
    <circle cx="80" cy="160" r="9" fill="#7DD3FC" />

    {[0, 72, 144, 216, 288].map((angle, i) => (
      <rect
        key={i}
        x="75"
        y="130"
        width="10"
        height="12"
        rx="2"
        fill="#7DD3FC"
        transform={`rotate(${angle} 80 160)`}
      />
    ))}

    {/* Tool icon */}
    <rect x="110" y="180" width="80" height="12" rx="6" fill="#6B7280" />
    <circle cx="100" cy="186" r="12" fill="#6B7280" />
    <circle cx="200" cy="186" r="8" fill="#6B7280" />

    {/* Sparkles */}
    <circle cx="60" cy="80" r="6" fill="#FDA4AF" opacity="0.6" />
    <circle cx="270" cy="150" r="8" fill="#6EE7B7" opacity="0.6" />
    <circle cx="180" cy="50" r="5" fill="#C4B5FD" opacity="0.6" />
  </svg>
);

// No Workers illustration
export const NoWorkersIllustration: React.FC<IllustrationProps> = ({
  width = 200,
  height = 160,
  className = '',
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 300 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background */}
    <ellipse cx="150" cy="220" rx="100" ry="15" fill="#FEF3C7" opacity="0.5" />

    {/* Ghost/placeholder figures */}
    <circle
      cx="100"
      cy="100"
      r="35"
      fill="#E5E7EB"
      stroke="#D1D5DB"
      strokeWidth="2"
      strokeDasharray="8 4"
    />
    <ellipse
      cx="100"
      cy="175"
      rx="25"
      ry="35"
      fill="#E5E7EB"
      stroke="#D1D5DB"
      strokeWidth="2"
      strokeDasharray="8 4"
    />
    <circle cx="90" cy="95" r="4" fill="#D1D5DB" />
    <circle cx="110" cy="95" r="4" fill="#D1D5DB" />
    <path d="M90 110 Q100 115 110 110" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />

    <circle
      cx="200"
      cy="100"
      r="35"
      fill="#E5E7EB"
      stroke="#D1D5DB"
      strokeWidth="2"
      strokeDasharray="8 4"
    />
    <ellipse
      cx="200"
      cy="175"
      rx="25"
      ry="35"
      fill="#E5E7EB"
      stroke="#D1D5DB"
      strokeWidth="2"
      strokeDasharray="8 4"
    />
    <circle cx="190" cy="95" r="4" fill="#D1D5DB" />
    <circle cx="210" cy="95" r="4" fill="#D1D5DB" />
    <path d="M190 110 Q200 115 210 110" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />

    {/* Plus sign suggesting to add */}
    <circle cx="150" cy="130" r="25" fill="#002169" />
    <rect x="144" y="118" width="12" height="24" rx="2" fill="white" />
    <rect x="138" y="124" width="24" height="12" rx="2" fill="white" />

    {/* Decorative */}
    <circle cx="50" cy="60" r="8" fill="#7DD3FC" opacity="0.5" />
    <circle cx="250" cy="50" r="10" fill="#6EE7B7" opacity="0.5" />
    <circle cx="270" cy="180" r="6" fill="#FDA4AF" opacity="0.5" />
  </svg>
);

// Loading/Processing illustration
export const LoadingIllustration: React.FC<IllustrationProps> = ({
  width = 120,
  height = 120,
  className = '',
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Rotating circle */}
    <circle cx="100" cy="100" r="70" fill="none" stroke="#E5E7EB" strokeWidth="8" />
    <path
      d="M100 30 A70 70 0 0 1 170 100"
      fill="none"
      stroke="#002169"
      strokeWidth="8"
      strokeLinecap="round"
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 100 100"
        to="360 100 100"
        dur="1s"
        repeatCount="indefinite"
      />
    </path>

    {/* Mule icon in center */}
    <circle cx="100" cy="100" r="35" fill="#002169" />
    <text x="100" y="108" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold">
      🫏
    </text>
  </svg>
);

export default {
  ScheduleIllustration,
  TeamIllustration,
  EmptyStateIllustration,
  SuccessIllustration,
  FocusModeIllustration,
  AvailabilityIllustration,
  SettingsIllustration,
  NoWorkersIllustration,
  LoadingIllustration,
};
