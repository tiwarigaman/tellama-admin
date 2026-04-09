import { AdminChrome } from '@/components/AdminChrome';

export default function AuthenticatedShellLayout({ children }) {
  return <AdminChrome>{children}</AdminChrome>;
}
