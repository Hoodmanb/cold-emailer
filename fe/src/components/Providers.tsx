// "use client";

// import React from "react";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import ThemeRegistry from "./ThemeRegistry";

// import { SnackbarProvider } from "../context/SnackbarContext";
// import { ProductivityProvider } from "../context/ProductivityContext";
// import AuthProvider from "../context/AuthProvider";
// import { GlobalModalProvider } from "./ui/Modal";

// // Browser-safe singleton QueryClient pattern
// let browserQueryClient: QueryClient | undefined = undefined;

// function makeQueryClient() {
//   return new QueryClient({
//     defaultOptions: {
//       queries: {
//         staleTime: 60_000,
//         refetchOnWindowFocus: false,
//         retry: 2, // Standard retry limit for all query hooks
//       },
//     },
//   });
// }

// function getQueryClient() {
//   if (typeof window === "undefined") {
//     // Server: always make a new query client
//     return makeQueryClient();
//   } else {
//     // Browser: make a new query client if we don't already have one
//     if (!browserQueryClient) {
//       console.log("[Providers] Initializing singleton QueryClient instance");
//       browserQueryClient = makeQueryClient();
//     }
//     return browserQueryClient;
//   }
// }

// export default function Providers({ children }: { children: React.ReactNode }) {
//   const queryClient = getQueryClient();

//   return (
//     <QueryClientProvider client={queryClient}>
//       <ThemeRegistry>
//         <SnackbarProvider>
//           <AuthProvider>
//             <ProductivityProvider>
//               <GlobalModalProvider>
//                 {children}
//               </GlobalModalProvider>
//             </ProductivityProvider>
//           </AuthProvider>
//         </SnackbarProvider>
//       </ThemeRegistry>
//     </QueryClientProvider>
//   );
// }


"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ThemeRegistry from "./ThemeRegistry";
import { SnackbarProvider } from "../context/SnackbarContext";
import { ProductivityProvider } from "../context/ProductivityContext";
import AuthProvider from "../context/AuthProvider";
import { GlobalModalProvider } from "./ui/Modal";
import dynamic from "next/dynamic";

// ─── Lazy-loaded widgets: only downloaded when actually needed
const FloatingProductivityWidget = dynamic(
  () => import("@/components/productivity/FloatingProductivityWidget"),
  { ssr: false }
);

const ProductivityModals = dynamic(
  () => import("@/components/productivity/ProductivityModals"),
  { ssr: false }
);

const SystemNoticeModal = dynamic(
  () => import("@/components/SystemNoticeModal"),
  { ssr: false }
);

const BillingGlobalModals = dynamic(
  () => import("@/components/billing/BillingGlobalModals"),
  { ssr: false }
);

// Browser-safe singleton QueryClient pattern
let browserQueryClient: QueryClient | undefined = undefined;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 2,
      },
    },
  });
}

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) {
      console.log("[Providers] Initializing singleton QueryClient instance");
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeRegistry>
        <SnackbarProvider>
          <AuthProvider>
            <ProductivityProvider>
              <GlobalModalProvider>
                {children}
                {/* These load asynchronously after the page is interactive */}
                <FloatingProductivityWidget />
                <ProductivityModals />
                <SystemNoticeModal />
                <BillingGlobalModals />
              </GlobalModalProvider>
            </ProductivityProvider>
          </AuthProvider>
        </SnackbarProvider>
      </ThemeRegistry>
    </QueryClientProvider>
  );
}