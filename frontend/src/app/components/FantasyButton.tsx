'use client';

import Link from 'next/link';
import React from 'react';
import { useTheme } from './ThemeProvider';

interface FantasyButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  showArrow?: boolean;
}

/**
 * A fantasy-themed button component with animated hover and click effects
 */
const FantasyButton: React.FC<FantasyButtonProps> = ({
  href,
  onClick,
  children,
  className = '',
  size = 'md',
  variant = 'primary',
  showArrow = true,
}) => {
  // Get current theme
  const { isDarkMode } = useTheme();

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-4 py-2',
    md: 'text-sm px-6 py-2.5',
    lg: 'text-base px-8 py-3',
  };

  // Variant classes with light/dark mode support - significantly improved visibility in light mode
  const variantClasses = {
    primary: isDarkMode 
      ? 'bg-fantasy-bronze border-fantasy-gold text-white hover:bg-fantasy-bronze/90 active:bg-fantasy-magic'
      : 'bg-fantasy-text border-3 border-fantasy-text text-white hover:bg-fantasy-bronze active:bg-fantasy-text shadow-md',
    secondary: isDarkMode
      ? 'bg-fantasy-surface border-fantasy-bronze text-fantasy-text hover:bg-fantasy-surface/80 active:bg-fantasy-copper/20'
      : 'bg-fantasy-leather border-3 border-fantasy-text text-white hover:bg-fantasy-bronze active:bg-fantasy-text shadow-md',
  };

  // Common classes for both button and link
  const commonClasses = `
    relative rounded-lg font-bold
    hover:text-white hover:border-opacity-100 hover:scale-[1.02]
    active:scale-95 active:border-white active:translate-y-0.5
    transition-all duration-200 inline-block overflow-hidden
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `;

  // Button content with animations
  const ButtonContent = () => (
    <>
      {/* Glow effect */}
      <div className={`absolute inset-0 ${isDarkMode ? 'bg-fantasy-magic' : 'bg-fantasy-text/50'} rounded-lg blur-sm group-hover:blur-md opacity-50 group-hover:opacity-80 transition-all duration-300 group-hover:scale-105`}></div>
      
      {/* Gold sparkle effect */}
      <div className="absolute -inset-1 scale-[0.8] opacity-0 group-hover:scale-[1.05] group-hover:opacity-100 transition-all duration-500">
        <div className={`absolute left-0 top-0 h-2 w-2 rounded-full ${isDarkMode ? 'bg-fantasy-gold' : 'bg-white'} animate-pulse`}></div>
        <div className={`absolute right-0 top-0 h-2 w-2 rounded-full ${isDarkMode ? 'bg-fantasy-gold' : 'bg-white'} animate-pulse delay-75`}></div>
        <div className={`absolute left-0 bottom-0 h-2 w-2 rounded-full ${isDarkMode ? 'bg-fantasy-gold' : 'bg-white'} animate-pulse delay-150`}></div>
        <div className={`absolute right-0 bottom-0 h-2 w-2 rounded-full ${isDarkMode ? 'bg-fantasy-gold' : 'bg-white'} animate-pulse delay-300`}></div>
      </div>
      
      {/* Shine effect */}
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent 
                      -translate-x-full group-hover:translate-x-full transition-all duration-1000"></span>
      
      {/* Button text with optional arrow */}
      <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] flex items-center justify-center font-bold">
        {children}
        {showArrow && (
          <svg className="w-5 h-5 ml-2 -mr-1 group-hover:translate-x-1 transition-transform duration-200" 
               fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
          </svg>
        )}
      </span>
    </>
  );

  // If href is provided, render as a Link
  if (href) {
    return (
      <div className="inline-block relative group">
        <Link href={href} className={commonClasses}>
          <ButtonContent />
        </Link>
      </div>
    );
  }

  // Otherwise, render as a button
  return (
    <div className="inline-block relative group">
      <button onClick={onClick} className={commonClasses}>
        <ButtonContent />
      </button>
    </div>
  );
};

export default FantasyButton; 