'use client';

import { FC, useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeToggleButton from './ThemeToggleButton';
import { useTheme } from './ThemeProvider';
import Login from './login/Login';

interface HeaderProps {}

const Header: FC<HeaderProps> = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-fantasy-background/80 dark:bg-[var(--fantasy-background)]/80 backdrop-blur-sm'
          : 'bg-transparent bg-fantasy-background'
      }`}
    >
      <header className="max-w-7xl mx-auto py-4 px-6">
        <div className="flex items-center justify-between">
          <div className="w-40">
            <Link
              href={'/'}
              className="text-black hover:text-fantasy-gold dark:text-[var(--fantasy-gold)] text-xl font-bold"
            >
              CRPG
            </Link>
          </div>

          <div className="flex justify-center absolute left-1/2 transform -translate-x-1/2 space-x-12">
            <Link href={'/'}>
              <span className="text-fantasy-text dark:text-[var(--fantasy-text)] text-sm hover:text-fantasy-gold dark:hover:text-[var(--fantasy-gold)]">
                Home
              </span>
            </Link>
            <Link href={'/story'}>
              <span className="text-fantasy-text dark:text-[var(--fantasy-text)] text-sm hover:text-fantasy-gold dark:hover:text-[var(--fantasy-gold)]">
                Story
              </span>
            </Link>
            <Link href={'/pages/marketplace'}>
              <span className="text-fantasy-text dark:text-[var(--fantasy-text)] text-sm hover:text-fantasy-gold dark:hover:text-[var(--fantasy-gold)]">
                Marketplace
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-6 w-40 justify-end">
            <Login buttonClassName="px-4 py-1 bg-fantasy-bronze dark:bg-[var(--fantasy-blood)] text-white dark:text-[var(--fantasy-gold)] text-sm rounded-full hover:opacity-90 transition-opacity" />

            <div className="flex justify-center">
              <ThemeToggleButton
                onToggle={toggleTheme}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
