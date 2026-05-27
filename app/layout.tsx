import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SoundAtlas",
  description: "Click a country and hear its sound.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
