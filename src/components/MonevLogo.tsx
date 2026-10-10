import React from 'react';

interface MonevLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  variant?: 'full' | 'emblem';
}

export const MonevLogo: React.FC<MonevLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full'
}) => {
  if (variant === 'emblem') {
    const sizeClasses = {
      sm: 'w-7 h-7',
      md: 'w-10 h-10',
      lg: 'w-14 h-14',
      xl: 'w-20 h-20',
      icon: 'w-full h-full'
    };

    return (
      <img
        src="/favicon.svg"
        alt="Logo MONEV Pelayanan Publik Kemenag Gunungkidul"
        className={`${sizeClasses[size]} object-contain shrink-0 ${className}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  const fullSizeClasses = {
    sm: 'h-9 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto',
    xl: 'h-24 w-auto',
    icon: 'w-full h-full'
  };

  return (
    <img
      src="/logo.svg"
      alt="Logo Resmi MONEV Pelayanan Publik Kemenag Gunungkidul"
      className={`${fullSizeClasses[size]} object-contain shrink-0 ${className}`}
      referrerPolicy="no-referrer"
    />
  );
};
