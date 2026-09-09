import type { SiteSettings } from "./settings";
import type { BlockedDate } from "./blocked-dates";
export type AdminUser = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  last_login: string | null;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category: string | null;
  price: string | number;
  sale_price: string | number | null;
  sku: string | null;
  stock_quantity: number;
  image_url: string | null;
  gallery_images: string[];
  featured: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Transformation = {
  id: string;
  name: string;
  description: string | null;
  before_image_url: string;
  after_image_url: string;
  sort_order: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Ad = {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  placement: string;
  sort_order: number;
  active: boolean;
  display_type: "embed" | "popup";
  starts_at: string | null;
  ends_at: string | null;
  popup_delay_seconds: number;
  created_at?: string;
  updated_at?: string;
};


async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "same-origin",
    ...init,
    ...(init?.body ? { headers: { "content-type": "application/json" } } : {}),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const err = new Error((data["error"] as string) ?? "Request failed") as Error & {
      status?: number;
    };
    err.status = res.status;
    throw err;
  }
  return data as T;
}

export const adminApi = {
  me: () => request<{ user: AdminUser }>("/api/admin/me"),
  login: (payload: { email: string; password: string; remember: boolean }) =>
    request<{ user: AdminUser }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () => request<{ ok: true }>("/api/admin/logout", { method: "POST" }),
  stats: () =>
    request<{
      counts: {
        products: number;
        orders: number;
        bookings: number;
        customers: number;
        unread_messages: number;
        revenue: string;
      };
      recentOrders: Array<{
        id: string;
        customer_name: string;
        total: string;
        status: string;
        created_at: string;
      }>;
      recentBookings: Array<{
        id: string;
        customer_name: string;
        service: string | null;
        scheduled_at: string | null;
        status: string;
      }>;
      lowStock: Array<{ id: string; name: string; stock_quantity: number }>;
      monthly: Array<{ label: string; orders: number; bookings: number; revenue: string }>;
      orderStatus: Array<{ label: string; value: number }>;
      bookingStatus: Array<{ label: string; value: number }>;
    }>("/api/admin/stats"),
  products: (query = "") => request<{ products: Product[] }>(`/api/admin/products${query}`),
  createProduct: (body: unknown) =>
    request<{ product: Product }>("/api/admin/products", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateProduct: (id: string, body: unknown) =>
    request<{ product: Product }>(`/api/admin/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  upload: async (file: File) => {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      credentials: "same-origin",
      body,
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) throw new Error((data["error"] as string) ?? "Upload failed");
    return data as { url: string; filename: string };
  },
  orders: (query = "") => request<{ orders: OrderSummary[] }>(`/api/admin/orders${query}`),
  order: (id: string) =>
    request<{ order: OrderDetail; items: OrderItem[] }>(`/api/admin/orders/${id}`),
  updateOrder: (id: string, body: { status?: string; payment_status?: string }) =>
    request<{ order: OrderDetail }>(`/api/admin/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  transformations: () =>
    request<{ transformations: Transformation[] }>("/api/admin/transformations"),
  createTransformation: (body: unknown) =>
    request<{ transformation: Transformation }>("/api/admin/transformations", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateTransformation: (id: string, body: unknown) =>
    request<{ transformation: Transformation }>(`/api/admin/transformations/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteTransformation: (id: string) =>
    request<{ ok: true }>(`/api/admin/transformations/${id}`, { method: "DELETE" }),
  ads: () => request<{ ads: Ad[] }>("/api/admin/ads"),
  createAd: (body: unknown) =>
    request<{ ad: Ad }>("/api/admin/ads", { method: "POST", body: JSON.stringify(body) }),
  updateAd: (id: string, body: unknown) =>
    request<{ ad: Ad }>(`/api/admin/ads/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  setAdActive: (id: string, active: boolean) =>
    request<{ ad: Ad }>(`/api/admin/ads/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    }),
  deleteAd: (id: string) => request<{ ok: true }>(`/api/admin/ads/${id}`, { method: "DELETE" }),
  deleteProduct: (id: string) =>
    request<{ ok: true }>(`/api/admin/products/${id}`, { method: "DELETE" }),
  customers: () => request<{ customers: Customer[] }>("/api/admin/customers"),
  messages: () => request<{ messages: Message[] }>("/api/admin/messages"),
  updateMessage: (id: string, body: { read: boolean }) =>
    request<{ message: Message }>(`/api/admin/messages/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteMessage: (id: string) =>
    request<{ ok: true }>(`/api/admin/messages/${id}`, { method: "DELETE" }),
  settings: () => request<{ settings: SiteSettings }>("/api/admin/settings"),
  updateSettings: (body: unknown) =>
    request<{ settings: SiteSettings }>("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
};

export type Customer = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postcode: string | null;
  address: string | null;
  notes: string | null;
  source: string | null;
  created_at: string;
  order_count: number;
  total_spent: string | number;
  booking_count: number;
};

export type Message = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  read: boolean;
  created_at: string;
  order_count: number;
  booking_count: number;
  city: string | null;
  country: string | null;
};

export type OrderSummary = {
  id: string;
  order_number: string;
  customer_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  total: string;
  status: string;
  payment_status: string;
  created_at: string;
};

export type OrderDetail = OrderSummary & {
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  notes: string | null;
  subtotal: string;
  delivery_fee: string;
};

export type OrderItem = {
  id?: string;
  product_id?: string | null;
  product_name: string;
  sku: string | null;
  unit_price: string;
  quantity: number;
  line_total: string;
};

export type CheckoutPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  notes?: string;
  items: Array<{ product_id: string; quantity: number }>;
};

export const contactApi = {
  send: (body: {
    full_name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
  }) =>
    request<{ message: { id: string } }>("/api/messages", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export const publicApi = {
  transformations: () =>
    request<{ transformations: Transformation[] }>("/api/transformations"),
  products: () => request<{ products: Product[] }>("/api/products"),
  product: (slug: string) => request<{ product: Product }>(`/api/products/${slug}`),
  placeOrder: (payload: CheckoutPayload) =>
    request<{ order: OrderDetail; items: OrderItem[] }>("/api/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  startCheckout: (payload: CheckoutPayload) =>
    request<{ url: string; order_number: string }>("/api/checkout-session", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  verifyPayment: (sessionId: string) =>
    request<{ paid: boolean; kind: string; pending: boolean; payment_status: string }>(
      `/api/payment-status?session_id=${encodeURIComponent(sessionId)}`,
    ),

  order: (orderNumber: string) =>
    request<{ order: OrderDetail; items: OrderItem[] }>(`/api/orders/${orderNumber}`),
};


export type ServiceCategory = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  active: boolean;
  service_count?: number;
};

export type Service = {
  id: string;
  category_id: string;
  category_name?: string;
  name: string;
  description: string | null;
  note?: string | null;
  price: string | number;
  duration_minutes: number;
  sort_order: number;
  active: boolean;
};

export type BookingItem = {
  id: string;
  service_id: string | null;
  service_name: string;
  category_name: string | null;
  unit_price: string | number;
  quantity: number;
  duration_minutes: number;
  line_total: string | number;
  status: string;
  payment_status: string;
};

export type Booking = {
  id: string;
  booking_reference: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  service: string | null;
  category_name: string | null;
  price: string;
  currency?: string | null;
  duration_minutes: number;
  preferred_date: string | null;
  preferred_time: string | null;
  notes: string | null;
  status: string;
  payment_status: string;
  payment_method: string | null;
  payment_provider: string | null;
  paid_at: string | null;
  created_at: string;
  stripe_payment_intent_id?: string | null;
  items?: BookingItem[];
};

export type BookingStats = {
  total: number;
  paid: number;
  pending_payment: number;
  completed: number;
  cancelled: number;
  revenue: string;
};


export const bookingApi = {
  categories: () =>
    request<{ categories: ServiceCategory[] }>("/api/admin/service-categories"),
  createCategory: (body: unknown) =>
    request<{ category: ServiceCategory }>("/api/admin/service-categories", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateCategory: (id: string, body: unknown) =>
    request<{ category: ServiceCategory }>(`/api/admin/service-categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteCategory: (id: string) =>
    request<{ ok: true }>(`/api/admin/service-categories/${id}`, { method: "DELETE" }),
  services: () => request<{ services: Service[] }>("/api/admin/services"),
  createService: (body: unknown) =>
    request<{ service: Service }>("/api/admin/services", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateService: (id: string, body: unknown) =>
    request<{ service: Service }>(`/api/admin/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  setServiceActive: (id: string, active: boolean) =>
    request<{ service: Service }>(`/api/admin/services/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    }),
  deleteService: (id: string) =>
    request<{ ok: true }>(`/api/admin/services/${id}`, { method: "DELETE" }),
  bookings: () =>
    request<{ bookings: Booking[]; stats: BookingStats }>("/api/admin/bookings"),
  updateBooking: (id: string, body: { status?: string; payment_status?: string }) =>
    request<{ booking: Booking }>(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  deleteBooking: (id: string) =>
    request<{ ok: true }>(`/api/admin/bookings/${id}`, { method: "DELETE" }),

  blockedDates: (upcomingOnly = false) =>
    request<{ blocked_dates: BlockedDate[] }>(
      `/api/admin/blocked-dates${upcomingOnly ? "?upcoming=1" : ""}`,
    ),
  countBookingsInRange: (start: string, end: string) =>
    request<{ affected_bookings: number }>(
      `/api/admin/blocked-dates?check_start=${start}&check_end=${end}`,
    ),
  createBlockedDate: (body: {
    start_date: string;
    end_date: string;
    reason: string;
    note?: string;
  }) =>
    request<{ blocked_date: BlockedDate; affected_bookings: number }>("/api/admin/blocked-dates", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateBlockedDate: (
    id: string,
    body: { start_date: string; end_date: string; reason: string; note?: string },
  ) =>
    request<{ blocked_date: BlockedDate }>(`/api/admin/blocked-dates/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteBlockedDate: (id: string) =>
    request<{ ok: true }>(`/api/admin/blocked-dates/${id}`, { method: "DELETE" }),
};

export type PublicService = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: string;
  duration_minutes: number;
};

export type PublicCategory = {
  id: string;
  name: string;
  description: string | null;
};

export const bookingPublicApi = {
  catalog: () =>
    request<{ categories: PublicCategory[]; services: PublicService[] }>("/api/services"),
  create: (body: {
    service_id?: string;
    items?: Array<{ service_id: string; quantity: number }>;
    full_name: string;
    email: string;
    phone: string;
    preferred_date: string;
    preferred_time: string;
    notes?: string;
  }) =>
    request<{ booking: Booking }>("/api/bookings", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  startCheckout: (body: {
    service_id?: string;
    items?: Array<{ service_id: string; quantity: number }>;
    full_name: string;
    email: string;
    phone: string;
    preferred_date: string;
    preferred_time: string;
    notes?: string;
  }) =>
    request<{ url: string | null; booking_reference: string; requires_payment: boolean }>("/api/booking-checkout-session", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  byReference: (reference: string) =>
    request<{ booking: PublicBooking }>(`/api/bookings/${reference}`),
  dayAvailability: (date: string, serviceId?: string, duration?: number) =>
    request<{
      date: string;
      unavailable: string[];
      slots: string[];
      closed: boolean;
      blocked: boolean;
      block_reason: string | null;
      unavailable_message: string | null;
      closed_weekdays: number[];
    }>(
      `/api/availability?date=${encodeURIComponent(date)}${
        serviceId ? `&service_id=${encodeURIComponent(serviceId)}` : ""
      }${duration && duration > 0 ? `&duration=${duration}` : ""}`,
    ),
  monthAvailability: (month: string, serviceId?: string, duration?: number) =>
    request<{
      month: string;
      fully_booked: string[];
      closed_weekdays: number[];
      blocked_dates: string[];
    }>(
      `/api/availability?month=${encodeURIComponent(month)}${
        serviceId ? `&service_id=${encodeURIComponent(serviceId)}` : ""
      }${duration && duration > 0 ? `&duration=${duration}` : ""}`,
    ),
};

export type PublicBooking = {
  id: string;
  booking_reference: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  service: string | null;
  category_name: string | null;
  price: string;
  duration_minutes: number;
  preferred_date: string | null;
  preferred_time: string | null;
  notes: string | null;
  status: string;
  payment_status: string;
  payment_method: string | null;
  stripe_payment_intent_id?: string | null;
  items?: BookingItem[];
};
