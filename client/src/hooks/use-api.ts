import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

// --- AUTH ---
export function useAuth() {
  return useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(api.auth.me.path, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 30000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { fullName: string; email?: string; role?: string }) => {
      const res = await fetch(api.auth.login.path, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data), credentials: "include"
      });
      if (!res.ok) throw new Error("Login failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.auth.me.path] })
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.auth.logout.path, { method: 'POST', credentials: "include" });
      if (!res.ok) throw new Error("Logout failed");
      return res.json();
    },
    onSuccess: () => {
      // Clear ALL cached data so protected pages show nothing after logout
      qc.clear();
      // Set the user to null immediately
      qc.setQueryData([api.auth.me.path], null);
    }
  });
}

// --- SERVICES ---
export function useServices() {
  return useQuery({
    queryKey: [api.services.list.path],
    queryFn: () => fetch(api.services.list.path).then(r => r.json())
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetch(api.services.create.path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.services.list.path] })
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => fetch(buildUrl(api.services.update.path, { id }), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.services.list.path] })
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fetch(buildUrl(api.services.delete.path, { id }), { method: 'DELETE', credentials: "include" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.services.list.path] })
  });
}

// --- PRODUCTS ---
export function useProducts() {
  return useQuery({
    queryKey: [api.products.list.path],
    queryFn: () => fetch(api.products.list.path).then(r => r.json())
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetch(api.products.create.path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.products.list.path] })
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => fetch(buildUrl(api.products.update.path, { id }), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.products.list.path] })
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fetch(buildUrl(api.products.delete.path, { id }), { method: 'DELETE', credentials: "include" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.products.list.path] })
  });
}

// --- BOOKINGS ---
export function useBookings() {
  return useQuery({
    queryKey: [api.bookings.list.path],
    queryFn: () => fetch(api.bookings.list.path, { credentials: "include" }).then(r => r.json())
  });
}

export function useAllBookings() {
  return useQuery({
    queryKey: [api.bookings.listAll.path],
    queryFn: () => fetch(api.bookings.listAll.path, { credentials: "include" }).then(r => r.json())
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetch(api.bookings.create.path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: "include" }).then(async r => {
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.bookings.list.path] })
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => fetch(buildUrl(api.bookings.updateStatus.path, { id }), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }), credentials: "include" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [api.bookings.list.path] }); qc.invalidateQueries({ queryKey: [api.bookings.listAll.path] }); }
  });
}

// --- TECHNICIANS ---
export function useTechnicians() {
  return useQuery({
    queryKey: [api.technicians.list.path],
    queryFn: () => fetch(api.technicians.list.path).then(r => r.json())
  });
}

export function useAllTechnicians() {
  return useQuery({
    queryKey: [api.technicians.listAll.path],
    queryFn: () => fetch(api.technicians.listAll.path, { credentials: "include" }).then(r => r.json())
  });
}

export function useMyJobs() {
  return useQuery({
    queryKey: [api.technicians.myJobs.path],
    queryFn: () => fetch(api.technicians.myJobs.path, { credentials: "include" }).then(r => r.json())
  });
}

export function useMyEarnings() {
  return useQuery({
    queryKey: [api.technicians.myEarnings.path],
    queryFn: () => fetch(api.technicians.myEarnings.path, { credentials: "include" }).then(r => r.json())
  });
}

export function useUpdateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => fetch(buildUrl(api.technicians.updateJob.path, { id }), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }), credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.technicians.myJobs.path] })
  });
}

// --- REVIEWS ---
export function useReviews() {
  return useQuery({
    queryKey: [api.reviews.list.path],
    queryFn: () => fetch(api.reviews.list.path).then(r => r.json())
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetch(api.reviews.create.path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.reviews.list.path] })
  });
}

// --- IQAMA ---
export function useIqamaTrackers() {
  return useQuery({
    queryKey: [api.iqama.list.path],
    queryFn: () => fetch(api.iqama.list.path, { credentials: "include" }).then(r => r.json())
  });
}

export function useCreateIqamaTracker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetch(api.iqama.create.path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.iqama.list.path] })
  });
}

export function useDeleteIqamaTracker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fetch(buildUrl(api.iqama.delete.path, { id }), { method: 'DELETE', credentials: "include" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.iqama.list.path] })
  });
}

// --- PROMO ---
export function useValidatePromo() {
  return useMutation({
    mutationFn: (code: string) => fetch(api.promo.validate.path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) }).then(async r => {
      if (!r.ok) throw new Error("Invalid promo code");
      return r.json();
    })
  });
}

export function useAllPromoCodes() {
  return useQuery({
    queryKey: [api.promo.listAll.path],
    queryFn: () => fetch(api.promo.listAll.path, { credentials: "include" }).then(r => r.json())
  });
}

export function useCreatePromoCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetch(api.promo.create.path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.promo.listAll.path] })
  });
}

// --- ADMIN ---
export function useAdminAnalytics() {
  return useQuery({
    queryKey: [api.admin.analytics.path],
    queryFn: () => fetch(api.admin.analytics.path, { credentials: "include" }).then(r => r.json())
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: [api.admin.users.path],
    queryFn: () => fetch(api.admin.users.path, { credentials: "include" }).then(r => r.json())
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => fetch(buildUrl(api.admin.updateUserRole.path, { id }), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }), credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.admin.users.path] })
  });
}
