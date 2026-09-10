import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'JANMITRA - Legal Investigation System',
  description: 'JANMITRA - Legal Investigation System',
  icons: {
    icon: '/logo.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const preferenceInitScript = `
(function() {
  try {
    var raw = localStorage.getItem('userPreferences');
    if (!raw) {
      var userRaw = localStorage.getItem('user');
      if (userRaw) {
        var u = JSON.parse(userRaw);
        if (u && u.preferences) raw = JSON.stringify(u.preferences);
      }
    }
    if (raw) {
      var p = JSON.parse(raw);
      var html = document.documentElement;
      if (p.highContrast) {
        html.classList.add('high-contrast');
      }
      if (p.textSize === 'Small') {
        html.classList.add('text-size-small');
        html.style.fontSize = '13.5px';
      } else if (p.textSize === 'Large') {
        html.classList.add('text-size-large');
        html.style.fontSize = '17.5px';
      } else {
        html.classList.add('text-size-medium');
        html.style.fontSize = '15px';
      }
    }
  } catch (e) {}
})();
`;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: preferenceInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
