// Bentuk respons wavy-backend yang dipakai app customer (sama dengan wavy-next/src/types/type.ts).

export interface Customer {
  id: number;
  name: string | null;
  email: string;
}

/** GET/PATCH /me */
export interface CustomerProfile extends Customer {
  phone: string;
  needs_name: boolean;
}

export type SalesStatus = 'upcoming' | 'open' | 'closed' | 'sold_out';

export interface Concert {
  id: number;
  title: string;
  category: string;
  venue: string;
  date: string;
  poster_url: string | null;
  banner_url?: string | null;
  status: string;
  artist_name: string;
  min_price: string | number | null;
  remaining: number;
  sales_status?: SalesStatus;
  sales_start_at?: string | null;
  sales_end_at?: string | null;
}

export interface TicketCategory {
  id: number;
  event_id: number;
  name: string;
  price: string | number;
  quota: number;
  sold: number;
  remaining?: number;
  benefits?: string | null;
  sales_status?: SalesStatus;
}

export interface ConcertDetail extends Concert {
  artist_id: number;
  description: string | null;
  genre: string | null;
  photo_url: string | null;
  bio: string | null;
  countdown_seconds: number;
  terms_conditions?: string | null;
  sales_status: SalesStatus;
  sales_start_at: string | null;
  sales_end_at: string | null;
  ticket_categories: TicketCategory[];
  avg_rating: number;
  review_count: number;
}

export type OrderStatus = 'pending_payment' | 'paid' | 'rejected' | 'refunded' | 'expired';

export interface Order {
  id: number;
  customer_id: number;
  event_id: number;
  ticket_category_id: number;
  quantity: number;
  total_price: string | number;
  status: OrderStatus;
  expires_at: string | null;
  created_at: string;
  paid_at?: string | null;
  event_title?: string | null;
  category_name?: string | null;
  poster_url?: string | null;
  event_date?: string | null;
  venue?: string | null;
  full_name?: string;
  email?: string;
  phone?: string;
}

export interface Ticket {
  id: number;
  order_id: number;
  owner_id: number;
  qr_code: string;
  is_scanned: boolean;
  event_id: number;
  title: string;
  date: string;
  venue: string;
  category: string;
  poster_url: string | null;
}

export interface CustomerLevel {
  attended_concerts: number;
  level: number;
  level_label: string;
}

export interface NotificationItem {
  id: number;
  customer_id: number;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface HomepageResponse {
  featured_events: Concert[];
}
