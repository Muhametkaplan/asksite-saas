import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#ff4d6d",
};

export const metadata: Metadata = {
  title: 'AskSite - Çift Siteniz & Dijital Anı Defteriniz',
  description: 'Sevgilinizle özel anılarınızı biriktireceğiniz dijital çift platformu.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon.png?v=2', type: 'image/png' },
    ],
    apple: '/apple-icon.png?v=2',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AskSite',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ff4d6d" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('SW registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
