import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAdminUsers, useUpdateUserRole } from "@/hooks/use-api";
import { Users, Search, Shield, User, Wrench } from "lucide-react";
import { motion } from "framer-motion";

export function AdminUsers() {
  const { t } = useLanguage();
  const { data: users = [], isLoading } = useAdminUsers();
  const updateRole = useUpdateUserRole();
  const [search, setSearch] = useState("");

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
              className="glass rounded-2xl p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shrink-0">
                {user.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{user.fullName}</p>
                <p className="text-muted-foreground text-xs truncate">{user.email || user.phone || `User #${user.id}`}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${roleColor[user.role || 'customer']}`}>
                  <RIcon size={10} /> {user.role || 'customer'}
                </span>
                <select
                  value={user.role || 'customer'}
                  onChange={e => updateRole.mutate({ id: user.id, role: e.target.value })}
                  className="text-xs px-2 py-1 rounded-lg bg-background border border-border outline-none cursor-pointer"
                >
                  <option value="customer">Customer</option>
                  <option value="technician">Technician</option>
                  <option value="admin">Admin</option>
                </select>
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
