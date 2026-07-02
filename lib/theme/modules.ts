/**
 * Sidebar module definitions (reference: yumo-superapp.jsx MOD).
 */

export const MOD: Record<
  string,
  { neon: string; dim: string; mid: string; name: string; icon: string }
> = {
  economy: { neon: "#00ff88", dim: "#00ff8820", mid: "#00ff8840", name: "Ekonomi", icon: "economy" },
  insights: { neon: "#00d4aa", dim: "#00d4aa20", mid: "#00d4aa40", name: "İçgörüler", icon: "insights" },
  guild: { neon: "#a855f7", dim: "#a855f720", mid: "#a855f740", name: "Guild", icon: "guild" },
  games: { neon: "#ff6b00", dim: "#ff6b0020", mid: "#ff6b0040", name: "Oyunlar", icon: "games" },
  ai: { neon: "#00aaff", dim: "#00aaff20", mid: "#00aaff40", name: "AI My Life", icon: "ai" },
  market: { neon: "#ffdd00", dim: "#ffdd0020", mid: "#ffdd0040", name: "Piyasa", icon: "market" },
  social: { neon: "#ff3d7f", dim: "#ff3d7f20", mid: "#ff3d7f40", name: "Sosyal", icon: "social" },
  basket: { neon: "#00ddcc", dim: "#00ddcc20", mid: "#00ddcc40", name: "Sepet", icon: "basket" },
};

export const SIDEBAR_MODS: { key: string; label: string; sub: string; comingSoon?: boolean }[] = [
  { key: "insights", label: "İçgörüler", sub: "Harcama, gizli maliyet, trend" },
  { key: "games", label: "Mini Oyunlar", sub: "Bütçe yarışması, trivia" },
  { key: "guild", label: "Guild", sub: "Grup tasarruf, rekabet", comingSoon: true },
  { key: "basket", label: "Sepet Karşılaştırma", sub: "Alternatif ürün karşılaştır", comingSoon: true },
  { key: "ai", label: "AI My Life", sub: "Kişisel finans asistanı", comingSoon: true },
  { key: "market", label: "Piyasa Takibi", sub: "Fiyat timeline, enflasyon", comingSoon: true },
  { key: "social", label: "Sosyal Feed", sub: "Arkadaş aktiviteleri", comingSoon: true },
];
