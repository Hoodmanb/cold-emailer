import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "../styles/globals.css";
import { SnackbarProvider } from "@/context/SnackbarContext";
import AuthProvider from "@/context/AuthProvider";
import { GlobalModalProvider } from "@/components/ui/Modal.jsx";
import Providers from "@/components/Providers";
import FloatingProductivityWidget from "@/components/productivity/FloatingProductivityWidget";
import ProductivityModals from "@/components/productivity/ProductivityModals";

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
          <SnackbarProvider>
            <AuthProvider>
              <GlobalModalProvider>
                {children}
                <FloatingProductivityWidget />
                <ProductivityModals />
              </GlobalModalProvider>
            </AuthProvider>
          </SnackbarProvider>
        </Providers>
      </body>
    </html>
  );
}
