import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ULife Furniture',
  description: 'Trang web chinh thuc cua xuong noi that ULIFe.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
