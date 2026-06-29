// import type { Metadata } from "next";
// import { Inter, Roboto_Mono } from "next/font/google";
// import "../styles/globals.css";
// import Providers from "@/components/Providers";
// import dynamic from "next/dynamic";

// // ─── Lazy-loaded: these are only downloaded when actually needed, not on
// //     every initial page load. This removes ~60KB+ from the critical bundle.
// const FloatingProductivityWidget = dynamic(
//   () => import("@/components/productivity/FloatingProductivityWidget"),
//   { ssr: false }
// );

// const ProductivityModals = dynamic(
//   () => import("@/components/productivity/ProductivityModals"),
//   { ssr: false }
// );

// const SystemNoticeModal = dynamic(
//   () => import("@/components/SystemNoticeModal"),
//   { ssr: false }
// );

// const BillingGlobalModals = dynamic(
//   () => import("@/components/billing/BillingGlobalModals"),
//   { ssr: false }
// );

// const inter = Inter({
//   variable: "--font-inter",
//   subsets: ["latin"],
//   display: "swap", // prevents FOIT (flash of invisible text)
// });

// const robotoMono = Roboto_Mono({
//   variable: "--font-roboto-mono",
//   subsets: ["latin"],
//   display: "swap",
// });

// export const metadata: Metadata = {
//   title: "Career Automation Platform",
//   description: "AI-powered job automation — resumes, cover letters, cold emails, ATS optimization",
//   keywords: ["job automation", "AI resume", "cover letter generator", "ATS optimizer", "cold email"],
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en" suppressHydrationWarning>
//       <body className={`${inter.variable} ${robotoMono.variable}`} suppressHydrationWarning>
//         <Providers>
//           {children}
//           {/* These load asynchronously after the page is interactive */}
//           <FloatingProductivityWidget />
//           <ProductivityModals />
//           <SystemNoticeModal />
//           <BillingGlobalModals />
//         </Providers>
//       </body>
//     </html>
//   );
// }




import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "../styles/globals.css";
import Providers from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  display: "swap",
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
        </Providers>
      </body>
    </html>
  );
}