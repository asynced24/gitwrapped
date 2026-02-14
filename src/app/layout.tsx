import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitWrapped",
  description: "Transform your GitHub data into a credible, shareable developer identity snapshot.",
  keywords: ["GitHub", "analytics", "developer", "statistics"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
