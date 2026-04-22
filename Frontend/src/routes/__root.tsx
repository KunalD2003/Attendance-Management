import { Outlet, Link, createRootRoute, HeadContent, Scripts, useLocation, useNavigate } from "@tanstack/react-router";
import { Provider } from 'react-redux';
import { store, useAppSelector } from '@/store';
import { AppLayout } from '@/components/AppLayout';
import { useEffect } from 'react';
import { useMeQuery } from '@/store/api';
import { setCredentials } from '@/store/authSlice';
import { useAppDispatch } from '@/store';

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Synapse Attendance Management System" },
      { name: "description", content: "Real-time attendance management system" },
      { property: "og:title", content: "Synapse Attendance Management System" },
      { property: "og:description", content: "Real-time attendance management system" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Synapse" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <Provider store={store}>
      <AuthGate />
    </Provider>
  );
}

function AuthGate() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);
  const user = useAppSelector(s => s.auth.user);
  const location = useLocation();
  const navigate = useNavigate();
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');
  const { data, isLoading } = useMeQuery(undefined, { skip: !hasToken });

  useEffect(() => {
    if (data?.user) dispatch(setCredentials(data.user));
  }, [data, dispatch]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && location.pathname !== '/login') {
      navigate({ to: '/login' });
    }
    if (!isLoading && isAuthenticated && (location.pathname === '/login' || location.pathname === '/')) {
      navigate({ to: '/dashboard' });
    }
    if (!isLoading && user?.role === 'employee' && location.pathname.startsWith('/admin')) {
      navigate({ to: '/dashboard' });
    }
    if (!isLoading && user?.role === 'manager' && location.pathname.startsWith('/admin')) {
      navigate({ to: '/dashboard' });
    }
  }, [isAuthenticated, location.pathname, navigate, isLoading, user?.role]);

  if (isLoading) return null;
  if (!isAuthenticated && location.pathname !== '/login') return null;
  if (isAuthenticated) return <AppLayout />;
  return <Outlet />;
}
