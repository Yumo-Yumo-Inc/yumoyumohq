"use client"

import { Card } from "@/components/ui/card"
import { ReceiptText, Zap, Trophy } from "lucide-react"
import { useTranslations } from "@/lib/i18n/hooks"

export function StatsCards() {
  const { t } = useTranslations()

  const stats = [
    {
      label: t("stats.receiptsTracked") || "Receipts tracked",
      value: t("stats.receiptsTrackedValue") || "—",
      icon: ReceiptText,
      color: "from-amber-500 to-orange-500",
      description: t("stats.receiptsTrackedDesc") || "Growing with each scan",
    },
    {
      label: t("stats.dataPhase") || "Data contribution phase",
      value: t("stats.dataPhaseValue") || "Active",
      icon: Zap,
      color: "from-blue-500 to-cyan-500",
      description: t("stats.dataPhaseDesc") || "Earn rewards by scanning",
    },
    {
      label: t("stats.communityRewards") || "Community rewards",
      value: t("stats.communityRewardsValue") || "cPoints",
      icon: Trophy,
      color: "from-amber-500 to-yellow-400",
      description: t("stats.communityRewardsDesc") || "Quests & challenges",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden border hover:shadow-xl transition-all">
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10`} />
          <div className="p-6 relative">
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}
            >
              <stat.icon className="w-7 h-7 text-white" />
            </div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm font-medium mb-1">{stat.label}</div>
            <div className="text-xs text-muted-foreground">{stat.description}</div>
          </div>
        </Card>
      ))}
    </div>
  )
}
