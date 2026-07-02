/**
 * Service providers — shared types and constants.
 *
 * Safe to import from both client and server (no DB / server-only
 * dependency). Type definitions live here rather than in server.ts;
 * server.ts re-exports from this file.
 */

export const SERVICE_PROVIDER_CATEGORIES = [
  "electricity",
  "water",
  "gas",
  "phone",
  "internet",
  "streaming",
  "entertainment",
  "digital_subscription",
  "other",
] as const;

export type ServiceProviderCategory = (typeof SERVICE_PROVIDER_CATEGORIES)[number];

export type ServiceProvider = {
  id: number;
  username: string;
  category: ServiceProviderCategory;
  name: string;
  paymentDay: number;
  reminderDaysBefore: number[];
  reminderSameDay: boolean;
  reminderHour: number;
  isActive: boolean;
  expectedAmount: number | null;
  lastPaidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateServiceProviderInput = {
  category: ServiceProviderCategory;
  name: string;
  paymentDay: number;
  reminderDaysBefore?: number[];
  reminderSameDay?: boolean;
  reminderHour?: number;
  expectedAmount?: number | null;
};

export type UpdateServiceProviderInput = Partial<{
  category: ServiceProviderCategory;
  name: string;
  paymentDay: number;
  reminderDaysBefore: number[];
  reminderSameDay: boolean;
  reminderHour: number;
  expectedAmount: number | null;
}>;

export type UpcomingPayment = {
  providerId: number;
  category: ServiceProviderCategory;
  name: string;
  dueDate: string;
  expectedAmount: number | null;
};

export function isValidCategory(value: unknown): value is ServiceProviderCategory {
  return (
    typeof value === "string" &&
    (SERVICE_PROVIDER_CATEGORIES as readonly string[]).includes(value)
  );
}
