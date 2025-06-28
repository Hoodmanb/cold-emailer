import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import { SnackbarProvider } from "@/context/SnackbarContext";
import AuthProvider from "@/context/AuthProvier";
import { GlobalModalProvider } from "@/components/ui/Modal.jsx";
import { ThemeProvider, CssBaseline } from "@mui/material";
import lightTheme from "../styles/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cold Mailer App",
  description: "A web app that provides features to create cold emails",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider theme={lightTheme}>
          <CssBaseline />
          <SnackbarProvider>
            <AuthProvider>
              <GlobalModalProvider>{children}</GlobalModalProvider>
            </AuthProvider>
          </SnackbarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
