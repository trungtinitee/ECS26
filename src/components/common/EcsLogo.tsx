import React from 'react';

interface EcsLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'icon' | 'full';
  className?: string;
  version?: string;
  subtitle?: string;
}

export const EcsLogoIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = '',
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl select-none group transition-transform duration-200 hover:scale-105 ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          {/* Main Background Gradient */}
          <linearGradient id="ecsBgGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0a3f27" />
            <stop offset="45%" stopColor="#13603d" />
            <stop offset="100%" stopColor="#1e8252" />
          </linearGradient>

          {/* Primary Eco Leaf / Wave Flow Gradient */}
          <linearGradient id="ecsFlowGrad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Clean Water & Air Cyan Accent */}
          <linearGradient id="ecsWaterGrad" x1="30" y1="10" x2="70" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="55%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          {/* Subtle Top Gloss Highlight */}
          <linearGradient id="ecsGloss" x1="50" y1="0" x2="50" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
          </linearGradient>

          {/* Subtle Shadow filter */}
          <filter id="ecsShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#042316" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* 1. Base Squircle / Rounded Diamond Container */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="26"
          fill="url(#ecsBgGrad)"
          stroke="#38a169"
          strokeWidth="1.5"
          strokeOpacity="0.35"
        />

        {/* 2. Top-half Glass Sheen */}
        <rect
          x="4"
          y="4"
          width="92"
          height="46"
          rx="26"
          fill="url(#ecsGloss)"
        />

        {/* 3. Subtle background calculation grid & nodes */}
        <g opacity="0.18" stroke="#ffffff" strokeWidth="1" strokeDasharray="2 3">
          <circle cx="50" cy="50" r="34" fill="none" />
          <line x1="16" y1="50" x2="84" y2="50" />
          <line x1="50" y1="16" x2="50" y2="84" />
        </g>

        {/* 4. Emblem: Stylized Dynamic Eco Ribbon forming 'E-C-S' & Water Drop */}
        <g filter="url(#ecsShadow)">
          {/* Main Leaf / Drop Loop (Left-to-Center) */}
          <path
            d="M50 20 C64 20 78 32 78 48 C78 64 66 78 50 78 C36 78 24 66 24 52 C24 38 36 24 50 20 Z"
            fill="none"
            stroke="url(#ecsWaterGrad)"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Intertwining S-curve ribbon & organic Eco Spine */}
          <path
            d="M32 38 C40 28 62 26 68 38 C74 50 48 52 52 64 C55 72 64 74 68 68"
            fill="none"
            stroke="url(#ecsFlowGrad)"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Central Water Drop & Engineering Precision Node */}
          <path
            d="M50 32 C50 32 40 46 40 52 C40 57.5 44.5 62 50 62 C55.5 62 60 57.5 60 52 C60 46 50 32 50 32 Z"
            fill="url(#ecsWaterGrad)"
            opacity="0.95"
          />

          {/* Spark of Innovation / Precision Center */}
          <circle cx="50" cy="52" r="2.8" fill="#ffffff" />
          <circle cx="68" cy="38" r="2.5" fill="#a7f3d0" />
          <circle cx="32" cy="54" r="2.2" fill="#67e8f9" />
        </g>
      </svg>
    </div>
  );
};

export const EcsLogo: React.FC<EcsLogoProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
  version = 'v7.4',
  subtitle = 'Environmental Calculation System',
}) => {
  let pixelSize = 36;
  if (typeof size === 'number') {
    pixelSize = size;
  } else {
    switch (size) {
      case 'xs':
        pixelSize = 24;
        break;
      case 'sm':
        pixelSize = 32;
        break;
      case 'md':
        pixelSize = 40;
        break;
      case 'lg':
        pixelSize = 56;
        break;
      case 'xl':
        pixelSize = 76;
        break;
    }
  }

  if (variant === 'icon') {
    return <EcsLogoIcon size={pixelSize} className={className} />;
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <EcsLogoIcon size={pixelSize} />

      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2">
          {/* Main Logo Text with refined typography */}
          <span className="font-extrabold text-lg sm:text-xl text-[#143d29] tracking-tight leading-none">
            ECS
          </span>

          {version && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#e3f2e8] text-[#176b45] border border-[#c1dcce] leading-none tracking-normal">
              {version}
            </span>
          )}
        </div>

        {subtitle && (
          <span className="text-[10px] sm:text-[11px] font-medium text-[#5f7568] tracking-normal leading-tight mt-0.5 hidden xs:block">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
