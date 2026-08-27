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
  icons: {
    icon: '/logo.png'
  },
  openGraph: {
    title: "Mental Health Predictor",
    description: "AI-powered mental health insights",
    images: ["/meta-image.png"], 
    url: "https://ai-powered-mental-health-predictor.vercel.app", 
    siteName: "Mental Health Predictor",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mental Health Predictor",
    description: "AI-powered mental health insights",
    images: ["/meta-image.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}