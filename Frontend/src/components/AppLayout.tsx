import { Outlet } from '@tanstack/react-router';
import { AppSidebar } from './AppSidebar';

export function AppLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}