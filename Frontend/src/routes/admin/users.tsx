import { createFileRoute } from '@tanstack/react-router';
import { ShieldCheck, User, Mail, Trash2, Save, Plus, Pencil, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCreateEmployeeMutation, useDeleteEmployeeMutation, useGetUsersQuery, useUpdateEmployeeMutation } from '@/store/api';
import type { UserRole } from '@/store/types';

export const Route = createFileRoute('/admin/users')({
  component: ManageUsersPage,
});

function ManageUsersPage() {
  const { data, refetch } = useGetUsersQuery();
  const [createEmployee, { isLoading: creating }] = useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: updating }] = useUpdateEmployeeMutation();
  const [deleteEmployee, { isLoading: deleting }] = useDeleteEmployeeMutation();
  const users = useMemo(() => data?.users ?? [], [data?.users]);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'employee' | 'manager'>('employee');
  const [newDepartment, setNewDepartment] = useState('');
  const [editUser, setEditUser] = useState<{
    id: string;
    name: string;
    role: UserRole;
    department: string;
  } | null>(null);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Manage Users</h1>

      <div className="glass-card rounded-xl p-4 space-y-4">
        <h2 className="font-display text-lg font-semibold text-foreground">Add User</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className="h-9 rounded-lg bg-input border border-border px-3 text-sm text-foreground" />
          <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email" className="h-9 rounded-lg bg-input border border-border px-3 text-sm text-foreground" />
          <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Password" type="password" className="h-9 rounded-lg bg-input border border-border px-3 text-sm text-foreground" />
          <select value={newRole} onChange={(e) => setNewRole(e.target.value as 'employee' | 'manager')} className="h-9 rounded-lg bg-input border border-border px-3 text-sm text-foreground">
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
          </select>
          <input value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)} placeholder="Department" className="h-9 rounded-lg bg-input border border-border px-3 text-sm text-foreground" />
        </div>
        <button
          disabled={creating || !newName || !newEmail || !newPassword}
          onClick={async () => {
            await createEmployee({ name: newName, email: newEmail, password: newPassword, role: newRole, department: newDepartment }).unwrap();
            setNewName('');
            setNewEmail('');
            setNewPassword('');
            setNewRole('employee');
            setNewDepartment('');
            await refetch();
          }}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Department</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" /> {u.email}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                    <ShieldCheck className="h-3 w-3" /> {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {u.department || '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() =>
                          setEditUser({
                            id: u.id,
                            name: u.name,
                            role: u.role,
                            department: u.department ?? '',
                          })
                        }
                        className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {u.role === 'employee' && (
                      <button
                        disabled={deleting}
                        onClick={async () => {
                          const ok = window.confirm(`Safely delete employee "${u.name}"? This action deactivates the account.`);
                          if (!ok) return;
                          await deleteEmployee({ id: u.id }).unwrap();
                          await refetch();
                        }}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
                        title="Delete Employee"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No active users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editUser && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-card rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground">Edit User</h2>
              <button
                onClick={() => setEditUser(null)}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={editUser.name}
                onChange={(e) => setEditUser((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                placeholder="Name"
                className="w-full h-9 rounded-lg bg-input border border-border px-3 text-sm text-foreground"
              />
              <select
                value={editUser.role}
                onChange={(e) => setEditUser((prev) => (prev ? { ...prev, role: e.target.value as UserRole } : prev))}
                className="w-full h-9 rounded-lg bg-input border border-border px-3 text-sm text-foreground"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>
              <input
                value={editUser.department}
                onChange={(e) => setEditUser((prev) => (prev ? { ...prev, department: e.target.value } : prev))}
                placeholder="Department"
                className="w-full h-9 rounded-lg bg-input border border-border px-3 text-sm text-foreground"
              />
            </div>

            <button
              disabled={updating}
              onClick={async () => {
                if (!editUser) return;
                await updateEmployee({
                  id: editUser.id,
                  name: editUser.name,
                  role: editUser.role === 'admin' ? undefined : editUser.role,
                  department: editUser.department,
                }).unwrap();
                setEditUser(null);
                await refetch();
              }}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}