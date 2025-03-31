import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { ReduxProvider } from "../store/provider";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Another World Adventure',
  description: 'A TRPG DAO NFT Web3 Game Project',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReduxProvider>
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
