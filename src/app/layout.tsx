import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cleanupDataOnStartup } from './lib/utils/data-cleanup';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "/lit/-AI",
  description: "AI-powered analysis of online discourse",
  icons: {
    icon: '/favicon.png',
  },
};

// Run data cleanup on startup
cleanupDataOnStartup().catch(error => {
  console.error('Failed to run data cleanup:', error);
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
