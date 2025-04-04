'use client';

import Header from './Header';
import Footer from './Footer';

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-fantasy-background dark:bg-[var(--fantasy-background)] text-fantasy-text dark:text-[var(--fantasy-text)] transition-colors duration-300">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
