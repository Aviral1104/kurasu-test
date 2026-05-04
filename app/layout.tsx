import type { Metadata } from "next";
import { Inter, Outfit, Space_Grotesk, Syne } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";
import ThemeProvider from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", weight: ["400","500","600","700","800"] });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-rank", weight: ["400","500","600","700"] });
const syne = Syne({ subsets: ["latin"], variable: "--font-system", weight: ["400","600","700","800"] });

export const metadata: Metadata = {
  title: "Kurasu — Your Personal Learning OS",
  description:
    "Paste any YouTube playlist and turn it into a structured course with AI-generated notes, quizzes, and streaks. Learn smarter, not harder.",
  keywords: [
    "learning",
    "youtube courses",
    "study tracker",
    "AI notes",
    "online learning",
  ],
  openGraph: {
    title: "Kurasu — Your Personal Learning OS",
    description: "Turn YouTube playlists into structured courses with AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${spaceGrotesk.variable} ${syne.variable}`}>
      <body className="antialiased">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
