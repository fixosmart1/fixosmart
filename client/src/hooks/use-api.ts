import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) url = url.replace(`:${key}`, String(value));
    });
  }
  return url;
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: 'include', ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  if (res.status === 204) return null;
  return res.json();
}

function jsonMutation(method: string, path: string, body?: any) {
  return apiFetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  return useQuery({
    queryKey: ['/api/me'],
    queryFn: async () => {
      const res = await fetch('/api/me', { credentials: 'include' });
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
    mutationFn: (data: { fullName: string; email?: string; role?: string }) =>
      jsonMutation('POST', '/api/login', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/me'] }),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => jsonMutation('POST', '/api/logout'),
    onSuccess: () => { qc.clear(); qc.setQueryData(['/api/me'], null); },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { fullName?: string; email?: string; phone?: string; profilePhoto?: string }) =>
      jsonMutation('PATCH', '/api/profile', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/me'] }),
  });
}

// ─── SERVICES ─────────────────────────────────────────────────────────────────

export function useServices() {
  return useQuery({
    queryKey: ['/api/services'],
    queryFn: () => apiFetch('/api/services'),
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => jsonMutation('POST', '/api/services', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/services'] }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      jsonMutation('PUT', `/api/services/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/services'] }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/api/services/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/services'] }),
  });
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────

export function useProducts() {
  return useQuery({
    queryKey: ['/api/products'],
    queryFn: () => apiFetch('/api/products'),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => jsonMutation('POST', '/api/products', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/products'] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      jsonMutation('PUT', `/api/products/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/products'] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/api/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/products'] }),
  });
}

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────

export function useBookings() {
  return useQuery({
    queryKey: ['/api/bookings'],
    queryFn: () => apiFetch('/api/bookings'),
  });
}

export function useAllBookings() {
  return useQuery({
    queryKey: ['/api/admin/bookings'],
    queryFn: () => apiFetch('/api/admin/bookings'),
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => jsonMutation('POST', '/api/bookings', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/bookings'] }),
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      jsonMutation('PATCH', `/api/bookings/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/bookings'] });
      qc.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
    },
  });
}

export function useAssignTechnician() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, technicianId }: { bookingId: number; technicianId: number | null }) =>
      jsonMutation('PATCH', `/api/admin/bookings/${bookingId}/assign`, { technicianId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/admin/bookings'] }),
  });
}

// ─── TECHNICIANS ──────────────────────────────────────────────────────────────

export function useTechnicians() {
  return useQuery({
    queryKey: ['/api/technicians'],
    queryFn: () => apiFetch('/api/technicians'),
  });
}

export function useAllTechnicians() {
  return useQuery({
    queryKey: ['/api/admin/technicians'],
    queryFn: () => apiFetch('/api/admin/technicians'),
  });
}

export function useMyJobs() {
  return useQuery({
    queryKey: ['/api/technician/jobs'],
    queryFn: () => apiFetch('/api/technician/jobs'),
  });
}

export function useMyEarnings() {
  return useQuery({
    queryKey: ['/api/technician/earnings'],
    queryFn: () => apiFetch('/api/technician/earnings'),
  });
}

export function useUpdateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      jsonMutation('PATCH', `/api/technician/jobs/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/technician/jobs'] }),
  });
}

export function useCreateTechnician() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => jsonMutation('POST', '/api/technicians', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/admin/technicians'] }),
  });
}

export function useTechnicianProfile(id: number | undefined) {
  return useQuery({
    queryKey: ['/api/technicians', id],
    queryFn: () => apiFetch(`/api/technicians/${id}`),
    enabled: !!id,
  });
}

// ─── REVIEWS ──────────────────────────────────────────────────────────────────

export function useReviews() {
  return useQuery({
    queryKey: ['/api/reviews'],
    queryFn: () => apiFetch('/api/reviews'),
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => jsonMutation('POST', '/api/reviews', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/reviews'] }),
  });
}

// ─── IQAMA ────────────────────────────────────────────────────────────────────

export function useIqamaTrackers() {
  return useQuery({
    queryKey: ['/api/iqama'],
    queryFn: () => apiFetch('/api/iqama'),
  });
}

export function useCreateIqamaTracker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => jsonMutation('POST', '/api/iqama', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/iqama'] }),
  });
}

export function useDeleteIqamaTracker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/api/iqama/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/iqama'] }),
  });
}

// ─── PROMO ────────────────────────────────────────────────────────────────────

export function useValidatePromo() {
  return useMutation({
    mutationFn: (code: string) => jsonMutation('POST', '/api/promo/validate', { code }),
  });
}

export function useAllPromoCodes() {
  return useQuery({
    queryKey: ['/api/admin/promos'],
    queryFn: () => apiFetch('/api/admin/promos'),
  });
}

export function useCreatePromoCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => jsonMutation('POST', '/api/admin/promos', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/admin/promos'] }),
  });
}

// ─── SITE SETTINGS ────────────────────────────────────────────────────────────

export function useSiteSettings() {
  return useQuery<Record<string, string>>({
    queryKey: ['/api/settings'],
    queryFn: () => apiFetch('/api/settings'),
    staleTime: 60000,
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: () => apiFetch('/api/admin/settings'),
  });
}

export function useUpdateSiteSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      jsonMutation('PATCH', '/api/admin/settings', { key, value }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/settings'] });
      qc.invalidateQueries({ queryKey: ['/api/admin/settings'] });
    },
  });
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ['/api/admin/analytics'],
    queryFn: () => apiFetch('/api/admin/analytics'),
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: () => apiFetch('/api/admin/users'),
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      jsonMutation('PATCH', `/api/admin/users/${id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/admin/users'] }),
  });
}

export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, suspended }: { id: number; suspended: boolean }) =>
      jsonMutation('PATCH', `/api/admin/users/${id}/suspend`, { suspended }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/admin/users'] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/admin/users'] }),
  });
}
