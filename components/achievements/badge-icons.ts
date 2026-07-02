/**
 * Per-badge icon map — EVERY tier has its own icon (not one icon per track).
 * Icons are chosen to match each tier's name/meaning so no two badges in the
 * catalog are interchangeable. Keyed by the tier's badge key (config/achievements).
 */

import {
  Footprints,
  Home,
  Store,
  Building2,
  Landmark,
  Globe,
  ShoppingBasket,
  ShoppingCart,
  LayoutGrid,
  Boxes,
  CalendarCheck,
  Anchor,
  Flame,
  Gem,
  Sprout,
  Hammer,
  Star,
  Crown,
  Receipt,
  Wallet,
  Archive,
  Files,
  Trophy,
  Eye,
  Glasses,
  FileSearch,
  ShieldCheck,
  Radar,
  UserPlus,
  Users,
  Flag,
  type LucideIcon,
} from "lucide-react";

export const BADGE_TIER_ICON: Record<string, LucideIcon> = {
  // "İşletme Atlası" (Merchant Atlas) — urban exploration, widening reach
  ach_merchant_atlas_1: Footprints, // "Sokak Çocuğu" (street kid) tier
  ach_merchant_atlas_2: Home, // "Mahalle Bilgesi" (neighborhood sage) tier
  ach_merchant_atlas_3: Store, // "Şehir Kurdu" (city veteran) tier
  ach_merchant_atlas_4: Building2, // "Metropol Gezgini" (metropolis wanderer) tier
  ach_merchant_atlas_5: Landmark, // "Megakent" (megacity) tier
  ach_merchant_atlas_6: Globe, // "Dünya Vatandaşı" (world citizen) tier

  // "Çarşı Kâşifi" (Bazaar Explorer) — categories / market
  ach_aisle_explorer_1: ShoppingBasket, // "Reyon Gezgini" (aisle wanderer) tier
  ach_aisle_explorer_2: ShoppingCart, // "Pazar Kurdu" (market veteran) tier
  ach_aisle_explorer_3: LayoutGrid, // "Çarşı Bilgesi" (bazaar sage) tier
  ach_aisle_explorer_4: Boxes, // "Çarşı Efendisi" (bazaar master) tier

  // "Süreklilik" (Consistency) — streak / consistency
  ach_the_regular_1: CalendarCheck, // "Müdavim" (regular patron) tier
  ach_the_regular_2: Anchor, // "Demirbaş" (fixture) tier
  ach_the_regular_3: Flame, // "Sokak Efsanesi" (street legend) tier
  ach_the_regular_4: Gem, // "Köşe Taşı" (cornerstone) tier

  // "Yükseliş" (Rise) — account level rise
  ach_coming_up_1: Sprout, // "Çaylak" (rookie) tier
  ach_coming_up_2: Hammer, // "Usta" (master craftsman) tier
  ach_coming_up_3: Star, // "Reis" (chief) tier
  ach_coming_up_4: Crown, // "Şehrin Patronu" (city's boss) tier

  // "Fiş Destesi" (Receipt Stack) — verified receipt volume
  ach_receipt_stack_1: Receipt, // "Fiş Avcısı" (receipt hunter) tier
  ach_receipt_stack_2: Wallet, // "Cüzdan Kabarık" (fat wallet) tier
  ach_receipt_stack_3: Archive, // "Arşivci" (archivist) tier
  ach_receipt_stack_4: Files, // "Fiş Müptelası" (receipt addict) tier
  ach_receipt_stack_5: Trophy, // "Fiş İmparatoru" (receipt emperor) tier

  // "Keskin Göz" (Sharp Eye) — hidden cost surfaced
  ach_sharp_eye_1: Eye, // "Gözü Açık" (keen-eyed) tier
  ach_sharp_eye_2: Glasses, // "Açıkgöz" (shrewd) tier
  ach_sharp_eye_3: FileSearch, // "Faturayı Gören" (bill-reader) tier
  ach_sharp_eye_4: ShieldCheck, // "Kandırılmaz" (uncheatable) tier
  ach_sharp_eye_5: Radar, // "Şehrin Gözü" (eye of the city) tier

  // "Tayfa" (Crew) — referrals / crew
  ach_the_crew_1: UserPlus, // "Davetçi" (inviter) tier
  ach_the_crew_2: Users, // "Tayfa Başı" (crew chief) tier
  ach_the_crew_3: Flag, // "Mahalle Lideri" (neighborhood leader) tier
};
