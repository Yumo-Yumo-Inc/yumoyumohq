/**
 * Service providers — category-based icon and color maps.
 *
 * Both the `/app/bills` list and `components/app/home/service-providers-card.tsx`
 * read from this module. Kept as a single source so a new category updates
 * both places at once.
 */

import {
  BadgeCheck,
  Box,
  Droplet,
  Flame,
  Gamepad2,
  Globe,
  Music,
  Phone,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ServiceProviderCategory } from "./types";

export const CATEGORY_ICON: Record<ServiceProviderCategory, LucideIcon> = {
  electricity: Zap,
  water: Droplet,
  gas: Flame,
  phone: Phone,
  internet: Globe,
  streaming: Music,
  entertainment: Gamepad2,
  digital_subscription: BadgeCheck,
  other: Box,
};

/** Color set for icon + background tint (bills/page.tsx dark UI). */
export const CATEGORY_COLOR: Record<
  ServiceProviderCategory,
  { stroke: string; bg: string }
> = {
  electricity: { stroke: "#FAC775", bg: "rgba(186,117,23,0.18)" },
  water: { stroke: "#85B7EB", bg: "rgba(55,138,221,0.18)" },
  gas: { stroke: "#FF8A6B", bg: "rgba(232,90,60,0.18)" },
  phone: { stroke: "#B4B2A9", bg: "rgba(95,94,90,0.18)" },
  internet: { stroke: "#82ADB3", bg: "rgba(94,138,144,0.18)" },
  streaming: { stroke: "#ED93B1", bg: "rgba(212,83,126,0.18)" },
  entertainment: { stroke: "#AFA9EC", bg: "rgba(127,119,221,0.18)" },
  digital_subscription: { stroke: "#97C459", bg: "rgba(99,153,34,0.18)" },
  other: { stroke: "#8A867E", bg: "rgba(95,94,90,0.18)" },
};

/**
 * Tailwind utility color classes (for the home dashboard card).
 * Stroke + bg combined into a single string — used by call sites like
 * `service-providers-card.tsx` that merge classes with `cn(...)`.
 */
export const CATEGORY_TAILWIND: Record<ServiceProviderCategory, string> = {
  electricity: "bg-[#BA7517]/18 text-[#FAC775]",
  water: "bg-[#378ADD]/18 text-[#85B7EB]",
  gas: "bg-[#E85A3C]/18 text-[#FF8A6B]",
  phone: "bg-[#5F5E5A]/18 text-[#B4B2A9]",
  internet: "bg-[#5E8A90]/18 text-[#82ADB3]",
  streaming: "bg-[#D4537E]/18 text-[#ED93B1]",
  entertainment: "bg-[#7F77DD]/18 text-[#AFA9EC]",
  digital_subscription: "bg-[#639922]/18 text-[#97C459]",
  other: "bg-[#5F5E5A]/18 text-[#8A867E]",
};

export function categoryIcon(category: ServiceProviderCategory): LucideIcon {
  return CATEGORY_ICON[category] ?? CATEGORY_ICON.other;
}
