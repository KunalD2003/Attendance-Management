import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Settings, Save, CheckCircle2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { useUpdateMyProfileMutation } from '@/store/api';
import { setCredentials } from '@/store/authSlice';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const [updateMyProfile, { isLoading }] = useUpdateMyProfileMutation();
  const [name, setName] = useState(user?.name ?? '');
  const [department, setDepartment] = useState(user?.department ?? '');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name ?? '');
    setDepartment(user?.department ?? '');
  }, [user?.name, user?.department]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      const response = await updateMyProfile({ name, department }).unwrap();
      dispatch(setCredentials(response.user));
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError((err as { data?: { message?: string } })?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-foreground">Profile Settings</h1>

      <form onSubmit={handleUpdate} className="glass-card rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Settings className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Account</h2>
            <p className="text-sm text-muted-foreground">Update your name and department</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full h-10 rounded-lg bg-input border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</label>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="mt-1 w-full h-10 rounded-lg bg-input border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Department"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</label>
            <div className="mt-1 h-10 rounded-lg bg-muted border border-border px-3 flex items-center text-sm text-muted-foreground capitalize">
              {user?.role}
            </div>
          </div>
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}