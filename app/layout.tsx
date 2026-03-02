import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import '../styles/index.css';

export const metadata: Metadata = {
    title: 'HR System',
    description: 'Hệ thống quản lý nhân sự theo App Router',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}