import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "../styles/globals.css";
import Providers from "@/components/Providers";
import FloatingProductivityWidget from "@/components/productivity/FloatingProductivityWidget";
import ProductivityModals from "@/components/productivity/ProductivityModals";
import SystemNoticeModal from "@/components/SystemNoticeModal";
import BillingGlobalModals from "@/components/billing/BillingGlobalModals";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Career Automation Platform",
  description: "AI-powered job automation — resumes, cover letters, cold emails, ATS optimization",
  keywords: ["job automation", "AI resume", "cover letter generator", "ATS optimizer", "cold email"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${robotoMono.variable}`} suppressHydrationWarning>
        <Providers>
          {children}
          <FloatingProductivityWidget />
          <ProductivityModals />
          <SystemNoticeModal />
          <BillingGlobalModals />
        </Providers>
      </body>
    </html>
  );
}
