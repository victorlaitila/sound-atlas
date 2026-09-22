import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const title = "SoundAtlas";
const description = "Click a country and hear its sound.";

export const metadata: Metadata = {
  title,
  description,
  icons: {
    icon: "/sound-atlas-icon.png",
    apple: "/sound-atlas-icon.png",
  },
  openGraph: {
    title,
    description,
    images: ["/sound-atlas-icon.png"],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/sound-atlas-icon.png"],
  },
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
