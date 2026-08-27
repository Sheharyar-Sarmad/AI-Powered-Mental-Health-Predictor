import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

// ADD THIS LINE
export const dynamic = 'force-dynamic';

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mental Health Predictor",
  description: "AI-powered mental health insights",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}