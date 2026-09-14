import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import WhatsAppSupportWidget from "@/components/WhatsAppSupportWidget";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import VisitorPresenceTracker from "@/components/VisitorPresenceTracker";
import { Analytics } from "@vercel/analytics/react";

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
  title: 'Aşk Dünyamız',
  description: 'Sevgilinizle özel anılarınızı biriktireceğiniz dijital çift platformu.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Aşk Dünyamız',
  },
  icons: {
    icon: '/icon.png?v=5',
    apple: [
      { url: '/apple-icon.png?v=5', sizes: '180x180', type: 'image/png' },
    ],
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
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "yiaplnklki");
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col m-0 p-0">
        <Suspense fallback={null}>
          <VisitorPresenceTracker />
        </Suspense>
        <AnalyticsProvider />
        <Analytics />
        {children}
        <WhatsAppSupportWidget />
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
