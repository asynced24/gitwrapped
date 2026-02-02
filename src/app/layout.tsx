import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "GitWrapped | Your GitHub Year in Review",
  description: "Discover your GitHub story. Beautiful analytics, shareable cards, and insights about your coding journey.",
  keywords: ["GitHub", "analytics", "developer", "wrapped", "statistics", "coding"],
  authors: [{ name: "GitWrapped" }],
  openGraph: {
    title: "GitWrapped | Your GitHub Year in Review",
    description: "Discover your GitHub story with beautiful analytics and shareable cards.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dashboard">
      <body className={`${inter.variable} antialiased`}>
        <div className="gradient-bg" />
        {children}
      </body>
    </html>
  );
}
