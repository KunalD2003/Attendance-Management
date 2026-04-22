import { createFileRoute } from '@tanstack/react-router';
import { useAppSelector } from '@/store';
import { EmployeeDashboard } from '@/components/dashboards/EmployeeDashboard';
import { ManagerDashboard } from '@/components/dashboards/ManagerDashboard';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const user = useAppSelector(s => s.auth.user);
  if (!user) return null;

  switch (user.role) {
    case 'manager': return <ManagerDashboard />;
    case 'admin': return <AdminDashboard />;
    default: return <EmployeeDashboard />;
  }
}