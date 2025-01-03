import './styles/variables.css';
import './styles/page.module.css';

export const metadata = {
  title: "Cold Emailer",
  description: "Send Cold Emails With Ease",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
