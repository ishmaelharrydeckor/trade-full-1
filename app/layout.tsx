// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import BetaBanner from "@/components/beta/BetaBanner";

export const metadata: Metadata = {
  title: "Trade·Journal — AI-Powered Trading Journal",
  description:
    "Trade with discipline. Review with honesty. AI-powered trading journal for serious forex and MT5 traders.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('tj-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);else document.documentElement.setAttribute('data-theme','dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <BetaBanner />
        {children}
      </body>
    </html>
  );
}
