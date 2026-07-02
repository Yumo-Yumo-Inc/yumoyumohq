import { Card } from "@/components/ui/card"
import { TrendingUp, DollarSign, Users, Activity } from "lucide-react"

const stats = [
  {
    label: "Total Value Locked",
    value: "$2,847,392.00",
    change: "+12.5%",
    icon: DollarSign,
    trend: "up",
  },
  {
    label: "Active Users",
    value: "8,429",
    change: "+5.2%",
    icon: Users,
    trend: "up",
  },
  {
    label: "Total Transactions",
    value: "124,532",
    change: "+18.7%",
    icon: Activity,
    trend: "up",
  },
  {
    label: "Token Price",
    value: "$0.0287",
    change: "+3.1%",
    icon: TrendingUp,
    trend: "up",
  },
]

export function StatsOverview() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="p-6 bg-card border-border">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-accent flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
