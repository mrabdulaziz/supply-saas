import { AppShell } from '../../components/layout/AppShell';

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  return <AppShell allowedRoles={['SUPPLIER_ADMIN', 'SUPPLIER_STAFF']}>{children}</AppShell>;
}
