import './globals.css';

export const metadata = {
  title: 'Evacu8 — Pendamping Keputusan & Evakuasi Cepat',
  description: 'Prototype pendamping keputusan awal saat bencana dengan panduan keselamatan, peta komunitas, dan rencana keluarga.',
  applicationName: 'Evacu8',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    apple: '/apple-touch-icon.png'
  },
  manifest: '/site.webmanifest'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#F8FAFC] text-slate-800 antialiased selection:bg-[#90CAF9] selection:text-[#0D47A1]">
        {children}
      </body>
    </html>
  );
}
