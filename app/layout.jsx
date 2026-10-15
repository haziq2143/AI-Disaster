import './globals.css';

export const metadata = {
  title: 'AI Disaster Assistant — Pendamping Keputusan & Evakuasi Cepat',
  description: 'Prototype pendamping keputusan awal saat bencana dengan panduan keselamatan, peta komunitas, dan rencana keluarga.',
  applicationName: 'AI Disaster Assistant'
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
