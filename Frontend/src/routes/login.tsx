import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useAppDispatch } from '@/store';
import { setCredentials } from '@/store/authSlice';
import { api, useLoginMutation, useSignupMutation } from '@/store/api';
import { Fingerprint, Eye, EyeOff, AlertCircle } from 'lucide-react';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [signup, { isLoading: isSignupLoading }] = useSignupMutation();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const response = isSignup
        ? await signup({ name, email, password }).unwrap()
        : await login({ email, password }).unwrap();
      localStorage.setItem('token', response.token);
      dispatch(api.util.resetApiState());
      dispatch(setCredentials(response.user));
      navigate({ to: '/dashboard' });
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message || 'Authentication failed';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 glow-primary mb-4">
            <Fingerprint className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gradient">SYNAPSE</h1>
          <p className="text-sm text-muted-foreground mt-1">Attendance Management System</p>
        </div>

        {/* Form */}
        <div className="glass-card rounded-2xl p-8">
          <h2 className="font-display text-xl font-semibold text-foreground mb-6">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="mt-1 w-full h-10 rounded-lg bg-input border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Enter your name"
                  required={isSignup}
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1 w-full h-10 rounded-lg bg-input border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="you@company.com"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-10 rounded-lg bg-input border border-border px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isSignupLoading}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 glow-primary transition-all disabled:opacity-50"
            >
              {isLoading || isSignupLoading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-sm text-primary hover:underline"
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          <div className="mt-6 p-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground">
            Sign up as employee by default. Manager/Admin users can be created directly in database for assessment.
          </div>
        </div>
      </div>
    </div>
  );
}