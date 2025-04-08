import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import AppProvider from '@/app/providers/AppProvider';
import LayoutWrapper from './components/LayoutWrapper';
import { ReduxProvider } from '@/store/provider';
import UnloadHandler from './components/UnloadHandler';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TRPG DAO NFT',
  description: 'TRPG DAO NFT Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ReduxProvider>
          <AppProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
          </AppProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
