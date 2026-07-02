import { sql } from "@/lib/db/client";

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

type Row = {
  id: number;
  username: string;
  category: ServiceProviderCategory;
  name: string;
  payment_day: number;
  reminder_days_before: number[];
  reminder_same_day: boolean;
  reminder_hour: number;
  is_active: boolean;
  expected_amount: string | null;
  last_paid_at: string | null;
  created_at: string;
  updated_at: string;
};

function rowToProvider(row: Row): ServiceProvider {
  return {
    id: Number(row.id),
    username: row.username,
    category: row.category,
    name: row.name,
    paymentDay: row.payment_day,
    reminderDaysBefore: Array.isArray(row.reminder_days_before) ? row.reminder_days_before : [],
    reminderSameDay: Boolean(row.reminder_same_day),
    reminderHour: row.reminder_hour,
    isActive: Boolean(row.is_active),
    expectedAmount: row.expected_amount === null ? null : Number(row.expected_amount),
    lastPaidAt: row.last_paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listServiceProviders(username: string): Promise<ServiceProvider[]> {
  const rows = (await sql`
    SELECT id, username, category, name, payment_day,
           reminder_days_before, reminder_same_day, reminder_hour,
           is_active, expected_amount, last_paid_at, created_at, updated_at
    FROM service_providers
    WHERE username = ${username} AND is_active = TRUE
    ORDER BY payment_day ASC, created_at ASC
  `) as Row[];
  return rows.map(rowToProvider);
}

export async function getServiceProviderById(
  username: string,
  id: number,
): Promise<ServiceProvider | null> {
  const rows = (await sql`
    SELECT id, username, category, name, payment_day,
           reminder_days_before, reminder_same_day, reminder_hour,
           is_active, expected_amount, last_paid_at, created_at, updated_at
    FROM service_providers
    WHERE id = ${id} AND username = ${username}
    LIMIT 1
  `) as Row[];
  return rows.length > 0 ? rowToProvider(rows[0]) : null;
}

export type CreateServiceProviderInput = {
  category: ServiceProviderCategory;
  name: string;
  paymentDay: number;
  reminderDaysBefore?: number[];
  reminderSameDay?: boolean;
  reminderHour?: number;
  expectedAmount?: number | null;
};

export async function createServiceProvider(
  username: string,
  input: CreateServiceProviderInput
): Promise<ServiceProvider> {
  const reminders = (input.reminderDaysBefore ?? [3, 1])
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 30);
  const sameDay = Boolean(input.reminderSameDay);
  const hour = Number.isInteger(input.reminderHour) ? Math.min(23, Math.max(0, input.reminderHour!)) : 9;
  const expected = input.expectedAmount == null ? null : Number(input.expectedAmount);

  const rows = (await sql`
    INSERT INTO service_providers
      (username, category, name, payment_day, reminder_days_before, reminder_same_day, reminder_hour, expected_amount)
    VALUES
      (${username}, ${input.category}, ${input.name.trim()}, ${input.paymentDay},
       ${reminders}::int[], ${sameDay}, ${hour}, ${expected})
    RETURNING id, username, category, name, payment_day,
              reminder_days_before, reminder_same_day, reminder_hour,
              is_active, expected_amount, last_paid_at, created_at, updated_at
  `) as Row[];

  return rowToProvider(rows[0]);
}

export type UpdateServiceProviderInput = Partial<{
  name: string;
  category: ServiceProviderCategory;
  paymentDay: number;
  reminderDaysBefore: number[];
  reminderSameDay: boolean;
  reminderHour: number;
  expectedAmount: number | null;
  isActive: boolean;
  /** ISO timestamp or null. Used to mark the current period as paid. */
  lastPaidAt: string | null;
}>;

export async function updateServiceProvider(
  username: string,
  id: number,
  patch: UpdateServiceProviderInput
): Promise<ServiceProvider | null> {
  const current = (await sql`
    SELECT id, username, category, name, payment_day,
           reminder_days_before, reminder_same_day, reminder_hour,
           is_active, expected_amount, last_paid_at, created_at, updated_at
    FROM service_providers
    WHERE id = ${id} AND username = ${username}
    LIMIT 1
  `) as Row[];
  if (current.length === 0) return null;
  const c = current[0];

  const next = {
    name: patch.name?.trim() ?? c.name,
    category: patch.category ?? c.category,
    paymentDay: patch.paymentDay ?? c.payment_day,
    reminderDaysBefore: Array.isArray(patch.reminderDaysBefore) ? patch.reminderDaysBefore : c.reminder_days_before,
    reminderSameDay: typeof patch.reminderSameDay === "boolean" ? patch.reminderSameDay : c.reminder_same_day,
    reminderHour: typeof patch.reminderHour === "number" ? patch.reminderHour : c.reminder_hour,
    expectedAmount:
      patch.expectedAmount === undefined
        ? c.expected_amount === null
          ? null
          : Number(c.expected_amount)
        : patch.expectedAmount,
    isActive: typeof patch.isActive === "boolean" ? patch.isActive : c.is_active,
    lastPaidAt:
      patch.lastPaidAt === undefined
        ? c.last_paid_at
        : patch.lastPaidAt === null
          ? null
          : new Date(patch.lastPaidAt),
  };

  const rows = (await sql`
    UPDATE service_providers
    SET name = ${next.name},
        category = ${next.category},
        payment_day = ${next.paymentDay},
        reminder_days_before = ${next.reminderDaysBefore}::int[],
        reminder_same_day = ${next.reminderSameDay},
        reminder_hour = ${next.reminderHour},
        expected_amount = ${next.expectedAmount},
        is_active = ${next.isActive},
        last_paid_at = ${next.lastPaidAt},
        updated_at = NOW()
    WHERE id = ${id} AND username = ${username}
    RETURNING id, username, category, name, payment_day,
              reminder_days_before, reminder_same_day, reminder_hour,
              is_active, expected_amount, last_paid_at, created_at, updated_at
  `) as Row[];

  return rows.length > 0 ? rowToProvider(rows[0]) : null;
}

export async function deleteServiceProvider(username: string, id: number): Promise<boolean> {
  const rows = (await sql`
    UPDATE service_providers
    SET is_active = FALSE, updated_at = NOW()
    WHERE id = ${id} AND username = ${username} AND is_active = TRUE
    RETURNING id
  `) as { id: number }[];
  return rows.length > 0;
}

export type UpcomingPayment = {
  providerId: number;
  category: ServiceProviderCategory;
  name: string;
  paymentDay: number;
  daysUntil: number;
  dueDate: string;
  expectedAmount: number | null;
};

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function nextDueDate(now: Date, paymentDay: number): Date {
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastThisMonth = lastDayOfMonth(year, month);
  const dayThisMonth = Math.min(paymentDay, lastThisMonth);
  const candidateThisMonth = new Date(year, month, dayThisMonth, 0, 0, 0, 0);
  const today = new Date(year, month, now.getDate(), 0, 0, 0, 0);
  if (candidateThisMonth.getTime() >= today.getTime()) return candidateThisMonth;
  const nextMonthYear = month === 11 ? year + 1 : year;
  const nextMonthIndex = (month + 1) % 12;
  const lastNextMonth = lastDayOfMonth(nextMonthYear, nextMonthIndex);
  return new Date(nextMonthYear, nextMonthIndex, Math.min(paymentDay, lastNextMonth), 0, 0, 0, 0);
}

export async function listUpcomingPayments(
  username: string,
  withinDays = 30
): Promise<UpcomingPayment[]> {
  const providers = await listServiceProviders(username);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const items: UpcomingPayment[] = providers.map((p) => {
    const due = nextDueDate(today, p.paymentDay);
    const days = Math.round((due.getTime() - today.getTime()) / 86400000);
    return {
      providerId: p.id,
      category: p.category,
      name: p.name,
      paymentDay: p.paymentDay,
      daysUntil: days,
      dueDate: due.toISOString(),
      expectedAmount: p.expectedAmount,
    };
  });
  return items
    .filter((item) => item.daysUntil <= withinDays)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

export function isValidCategory(value: unknown): value is ServiceProviderCategory {
  return typeof value === "string" && (SERVICE_PROVIDER_CATEGORIES as readonly string[]).includes(value);
}
