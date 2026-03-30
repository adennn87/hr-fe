import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import '../styles/index.css';

export const metadata: Metadata = {
    title: 'HR System',
    description: 'HR Management System with App Router',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}