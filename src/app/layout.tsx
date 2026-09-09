import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'JANMITRA - Legal Investigation System',
  description: 'JANMITRA - Legal Investigation System',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
