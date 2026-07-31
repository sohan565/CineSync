import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { RootProvider } from '@/components/providers/root-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CineSync — Free Social Watch Party Platform',
  description:
    'Watch videos together in sub-second synchronization with real-time text chat, emoji reactions, and WebRTC voice & video calls.',
  keywords: ['watch party', 'synchronized video', 'video chat', 'youtube sync'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
