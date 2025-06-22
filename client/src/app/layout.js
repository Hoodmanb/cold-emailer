'use client'

import './styles/variables.css';
import './styles/page.module.css';
import { AuthProvider } from './context/AuthContext';

// export const metadata = {
//   title: "Cold Emailer",
//   description: "Send Cold Emails With Ease",
// };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
