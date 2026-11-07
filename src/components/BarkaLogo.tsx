import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark';
  showText?: boolean;
  inline?: boolean;
  className?: string;
}

export const BarkaLogo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'light',
  className = '',
}) => {
  const isDark = variant === 'dark';

  // Responsive height matching navigation & layout requirements
  const heightClass =
    size === 'sm'
      ? 'h-9 sm:h-10'
      : size === 'lg'
      ? 'h-16 sm:h-18'
      : size === 'xl'
      ? 'h-20 sm:h-24'
      : 'h-11 sm:h-13';

  if (isDark) {
    return (
      <div
        className={`inline-flex items-center select-none ${className}`}
        id="barka-brand-logo-dark"
      >
        <div className="bg-white/95 hover:bg-white rounded-xl sm:rounded-2xl px-2.5 py-1.5 shadow-md border border-white/30 transition-all group backdrop-blur-xs flex items-center justify-center">
          <img
            src="/barka-logo.png"
            alt="BARKA SOLUTIONS S.A.S"
            className={`${heightClass} w-auto object-contain transition-transform duration-300 group-hover:scale-103`}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center select-none ${className}`}
      id="barka-brand-logo"
    >
      <img
        src="/barka-logo.png"
        alt="BARKA SOLUTIONS S.A.S"
        className={`${heightClass} w-auto object-contain transition-transform duration-300 hover:scale-103`}
      />
    </div>
  );
};
