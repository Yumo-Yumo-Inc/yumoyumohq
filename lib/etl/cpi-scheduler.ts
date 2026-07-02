/**
 * CPI Update Schedule Strategy
 *
 * CPI data is typically:
 * - Published monthly
 * - The previous month's data is published mid-to-late in the new month
 * - Example: January CPI → published around February 15-20
 *
 * Strategy:
 * 1. Check on specific days of each month (twice)
 * 2. Update if new data is available
 * 3. If not, wait for the next check
 * 4. Publish dates can differ per country
 */

export interface CPISchedule {
  country: string;
  publishDayOfMonth: number[]; // [15, 25] = the 15th and 25th of the month
  timezone: string; // "Europe/Istanbul", "America/New_York"
  source: string; // "TURKSTAT", "BLS", etc.
  apiEndpoint?: string;
  requiresApiKey: boolean;
}

/**
 * CPI update schedules for each country
 *
 * publishDayOfMonth: days to check (which day of the month it's published on)
 * timezone: the country's timezone
 * source: data source
 */
export const CPI_SCHEDULES: CPISchedule[] = [
  {
    country: "TR",
    publishDayOfMonth: [15, 20], // TURKSTAT typically publishes between the 15th-20th
    timezone: "Europe/Istanbul",
    source: "TURKSTAT",
    requiresApiKey: false,
  },
  {
    country: "US",
    publishDayOfMonth: [10, 15], // BLS typically publishes between the 10th-15th of the month
    timezone: "America/New_York",
    source: "BLS",
    requiresApiKey: true, // BLS requires an API key
  },
  {
    country: "BR",
    publishDayOfMonth: [10, 15], // IBGE
    timezone: "America/Sao_Paulo",
    source: "IBGE",
    requiresApiKey: false,
  },
  {
    country: "IN",
    publishDayOfMonth: [12, 15], // Ministry of Statistics
    timezone: "Asia/Kolkata",
    source: "MOSPI",
    requiresApiKey: false,
  },
  {
    country: "CN",
    publishDayOfMonth: [9, 12], // National Bureau of Statistics
    timezone: "Asia/Shanghai",
    source: "NBS",
    requiresApiKey: false,
  },
  {
    country: "TH",
    publishDayOfMonth: [5, 10], // NESDC
    timezone: "Asia/Bangkok",
    source: "NESDC",
    requiresApiKey: false,
  },
  {
    country: "ID",
    publishDayOfMonth: [1, 5], // BPS
    timezone: "Asia/Jakarta",
    source: "BPS",
    requiresApiKey: false,
  },
  {
    country: "VN",
    publishDayOfMonth: [25, 30], // GSO
    timezone: "Asia/Ho_Chi_Minh",
    source: "GSO",
    requiresApiKey: false,
  },
  {
    country: "PH",
    publishDayOfMonth: [5, 10], // PSA
    timezone: "Asia/Manila",
    source: "PSA",
    requiresApiKey: false,
  },
  {
    country: "MY",
    publishDayOfMonth: [22, 25], // DOSM
    timezone: "Asia/Kuala_Lumpur",
    source: "DOSM",
    requiresApiKey: false,
  },
  {
    country: "SG",
    publishDayOfMonth: [23, 25], // SingStat
    timezone: "Asia/Singapore",
    source: "SingStat",
    requiresApiKey: false,
  },
  {
    country: "AE",
    publishDayOfMonth: [15, 20], // FCSA
    timezone: "Asia/Dubai",
    source: "FCSA",
    requiresApiKey: false,
  },
  {
    country: "CA",
    publishDayOfMonth: [15, 20], // Statistics Canada
    timezone: "America/Toronto",
    source: "StatisticsCanada",
    requiresApiKey: false,
  },
  {
    country: "ZA",
    publishDayOfMonth: [20, 25], // Stats SA
    timezone: "Africa/Johannesburg",
    source: "StatsSA",
    requiresApiKey: false,
  },
  {
    country: "MX",
    publishDayOfMonth: [8, 12], // INEGI
    timezone: "America/Mexico_City",
    source: "INEGI",
    requiresApiKey: false,
  },
  {
    country: "RU",
    publishDayOfMonth: [5, 10], // Rosstat
    timezone: "Europe/Moscow",
    source: "Rosstat",
    requiresApiKey: false,
  },
  {
    country: "UA",
    publishDayOfMonth: [5, 10], // State Statistics Service
    timezone: "Europe/Kiev",
    source: "StateStatisticsService",
    requiresApiKey: false,
  },
  {
    country: "KZ",
    publishDayOfMonth: [10, 15], // Bureau of National Statistics
    timezone: "Asia/Almaty",
    source: "BNS",
    requiresApiKey: false,
  },
  {
    country: "NG",
    publishDayOfMonth: [15, 20], // NBS
    timezone: "Africa/Lagos",
    source: "NBS",
    requiresApiKey: false,
  },
  {
    country: "TW",
    publishDayOfMonth: [5, 10], // DGBAS
    timezone: "Asia/Taipei",
    source: "DGBAS",
    requiresApiKey: false,
  },
];

/**
 * Determine if we should check for CPI update today
 * 
 * @param country - Country code
 * @returns true if today is a publish day for this country
 */
export function shouldCheckCPI(country: string): boolean {
  const schedule = CPI_SCHEDULES.find(s => s.country === country);
  if (!schedule) return false;
  
  const now = new Date();
  const dayOfMonth = now.getDate();
  
  return schedule.publishDayOfMonth.includes(dayOfMonth);
}

/**
 * Get all countries that should be checked today
 */
export function getCountriesToCheckToday(): string[] {
  return CPI_SCHEDULES
    .filter(schedule => shouldCheckCPI(schedule.country))
    .map(schedule => schedule.country);
}
