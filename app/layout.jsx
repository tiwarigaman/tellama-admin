import './globals.css';
import './admin/admin-theme.css';

export const metadata = {
  title: 'Admin',
  description: 'Internal admin',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
