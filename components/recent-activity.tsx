import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

const activities = [
  {
    type: "receipt",
    description: "Receipt uploaded",
    amount: "+125 YUMO",
    time: "2 min ago",
    positive: true,
  },
  {
    type: "reward",
    description: "Staking reward claimed",
    amount: "+89 YUMO",
    time: "1 hour ago",
    positive: true,
  },
  {
    type: "stake",
    description: "Tokens staked",
    amount: "-1,000 YUMO",
    time: "3 hours ago",
    positive: false,
  },
  {
    type: "receipt",
    description: "Receipt uploaded",
    amount: "+234 YUMO",
    time: "5 hours ago",
    positive: true,
  },
  {
    type: "reward",
    description: "Daily reward claimed",
    amount: "+50 YUMO",
    time: "1 day ago",
    positive: true,
  },
]

export function RecentActivity() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity, idx) => (
          <div key={idx} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  activity.positive ? "bg-accent/10" : "bg-muted"
                }`}
              >
                {activity.positive ? (
                  <ArrowUpRight className={`h-5 w-5 ${activity.positive ? "text-accent" : "text-muted-foreground"}`} />
                ) : (
                  <ArrowDownRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
            <span className={`text-sm font-semibold ${activity.positive ? "text-accent" : "text-foreground"}`}>
              {activity.amount}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
