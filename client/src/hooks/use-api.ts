import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type User, type Service, type Product, type Booking, type IqamaTracker } from "@shared/routes";

// --- AUTH HOOKS ---
export function useAuth() {
  return useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(api.auth.me.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Auth failed");
      return api.auth.me.responses[200].parse(await res.json());
    },
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fullName: string) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName }),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Login failed");
      return api.auth.login.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.auth.me.path] })
  });
}

// --- SERVICES & PRODUCTS ---
export function useServices() {
  return useQuery({
    queryKey: [api.services.list.path],
    queryFn: async () => {
      const res = await fetch(api.services.list.path);
      if (!res.ok) throw new Error("Failed to fetch services");
      return api.services.list.responses[200].parse(await res.json());
    }
  });
}

export function useProducts() {
  return useQuery({
    queryKey: [api.products.list.path],
    queryFn: async () => {
      const res = await fetch(api.products.list.path);
      if (!res.ok) throw new Error("Failed to fetch products");
      return api.products.list.responses[200].parse(await res.json());
    }
  });
}

// --- BOOKINGS ---
export function useBookings() {
  return useQuery({
    queryKey: [api.bookings.list.path],
    queryFn: async () => {
      const res = await fetch(api.bookings.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return api.bookings.list.responses[200].parse(await res.json());
    }
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.bookings.create.path, {
        method: api.bookings.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to create booking");
      return api.bookings.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.bookings.list.path] })
  });
}

// --- IQAMA TRACKER ---
export function useIqamaTrackers() {
  return useQuery({
    queryKey: [api.iqama.list.path],
    queryFn: async () => {
      const res = await fetch(api.iqama.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch iqama records");
      return api.iqama.list.responses[200].parse(await res.json());
    }
  });
}

export function useCreateIqamaTracker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.iqama.create.path, {
        method: api.iqama.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to create iqama record");
      return api.iqama.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.iqama.list.path] })
  });
}

export function useDeleteIqamaTracker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.iqama.delete.path, { id });
      const res = await fetch(url, { method: api.iqama.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.iqama.list.path] })
  });
}
