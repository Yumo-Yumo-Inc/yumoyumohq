"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Sparkles, Rocket, Globe } from "lucide-react"

const roadmapData = [
  {
    quarter: "Q1",
    title: "Journey Begins",
    icon: Sparkles,
    status: "completed",
    bgColor: "bg-green-50",
    iconColor: "bg-green-500",
    items: ["Smart contracts deployed", "Upload a receipt for a prize!"],
  },
  {
    quarter: "Q2",
    title: "Party Time!",
    icon: Sparkles,
    status: "upcoming",
    bgColor: "bg-purple-50",
    iconColor: "bg-purple-500",
    items: ["Free NFTs for early users", "Staking is coming"],
  },
  {
    quarter: "Q3",
    title: "Yumos Get Smarter",
    icon: Rocket,
    status: "upcoming",
    bgColor: "bg-blue-50",
    iconColor: "bg-blue-500",
    items: ["More countries on board", "New partnerships"],
  },
  {
    quarter: "Q4",
    title: "Global Expansion",
    icon: Globe,
    status: "upcoming",
    bgColor: "bg-orange-50",
    iconColor: "bg-orange-500",
    items: ["Local merchant deals", "NFT marketplace opens"],
  },
]

export function RoadmapCards() {
  return (
    <section id="roadmap" className="space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-bold">
          <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Yumo's Journey
          </span>{" "}
          The Cute Masterplan
        </h2>
        <p className="text-muted-foreground text-lg">Following our path to global domination, one receipt at a time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {roadmapData.map((phase, index) => (
          <Card
            key={index}
            className={`relative overflow-hidden border-0 transition-all hover:shadow-xl rounded-3xl ${phase.bgColor} p-6`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className={`w-14 h-14 rounded-2xl ${phase.iconColor} flex items-center justify-center`}>
                  <phase.icon className="w-7 h-7 text-white" />
                </div>
                {phase.status === "completed" && <CheckCircle2 className="w-6 h-6 text-green-500" />}
              </div>

              <div>
                <div className="text-3xl font-bold mb-1">{phase.quarter}</div>
                <div className="text-xl font-semibold">{phase.title}</div>
              </div>

              <ul className="space-y-3">
                {phase.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-purple-500 mt-0.5 font-bold">●</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
