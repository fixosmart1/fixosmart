import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAdminUsers, useUpdateUserRole, useSuspendUser, useDeleteUser } from "@/hooks/use-api";
import { Users, Search, Shield, User, Wrench, Ban, Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export function AdminUsers() {
  const { t } = useLanguage();
  const { data: users = [], isLoading } = useAdminUsers();
  const updateRole = useUpdateUserRole();
  const suspendUser = useSuspendUser();
  const deleteUser = useDeleteUser();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = users.filter((u: any) =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const roleIcon: any = { admin: Shield, technician: Wrench, customer: User };
  const roleColor: any = {
    admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    technician: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    customer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  const handleSuspend = async (id: number, currentlySuspended: boolean) => {
    try {
      await suspendUser.mutateAsync({ id, suspended: !currentlySuspended });
      toast({
        title: currentlySuspended ? "User unsuspended" : "User suspended",
        description: currentlySuspended ? "Account has been restored." : "Account has been suspended.",
      });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteUser.mutateAsync(id);
      toast({ title: "User deleted", description: `${name} has been removed.` });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Users className="text-blue-500" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('manage_users')}</h1>
            <p className="text-muted-foreground text-sm">{filtered.length} users total</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
        <input
          data-testid="input-search-users"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary outline-none transition-colors"
        />
      </div>

      <div className="space-y-3">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-4 animate-pulse h-20" />
            ))}
          </div>
        )}
        {filtered.map((user: any, i: number) => {
          const RIcon = roleIcon[user.role || 'customer'] || User;
          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`glass rounded-2xl p-4 flex items-center gap-4 ${user.suspended ? 'opacity-60 border border-destructive/30' : ''}`}
              data-testid={`row-user-${user.id}`}
            >
              {/* Avatar */}
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shrink-0 relative">
                {user.profilePhoto
                  ? <img src={user.profilePhoto} alt={user.fullName} className="w-10 h-10 rounded-full object-cover" />
                  : user.fullName.charAt(0)
                }
                {user.suspended && (
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center">
                    <Ban size={8} className="text-white" />
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold truncate">{user.fullName}</p>
                  {user.suspended && (
                    <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">SUSPENDED</span>
                  )}
                </div>
                <p className="text-muted-foreground text-xs truncate">{user.email || user.phone || `User #${user.id}`}</p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${roleColor[user.role || 'customer']}`}>
                  <RIcon size={10} /> {user.role || 'customer'}
                </span>

                {/* Role selector */}
                <select
                  data-testid={`select-role-${user.id}`}
                  value={user.role || 'customer'}
                  onChange={e => updateRole.mutate({ id: user.id, role: e.target.value })}
                  className="text-xs px-2 py-1 rounded-lg bg-background border border-border outline-none cursor-pointer"
                >
                  <option value="customer">Customer</option>
                  <option value="technician">Technician</option>
                  <option value="admin">Admin</option>
                </select>

                {/* Suspend toggle */}
                <button
                  data-testid={`button-suspend-${user.id}`}
                  onClick={() => handleSuspend(user.id, user.suspended)}
                  disabled={suspendUser.isPending}
                  title={user.suspended ? "Unsuspend" : "Suspend"}
                  className={`p-1.5 rounded-lg transition-colors ${
                    user.suspended
                      ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}
                >
                  {user.suspended ? <CheckCircle size={14} /> : <Ban size={14} />}
                </button>

                {/* Delete button */}
                <button
                  data-testid={`button-delete-${user.id}`}
                  onClick={() => handleDelete(user.id, user.fullName)}
                  disabled={deletingId === user.id}
                  title="Delete user"
                  className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users size={40} className="mx-auto mb-2 opacity-30" />
            <p>No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}
