"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

/**
 * INT allocation — locked 2026-05-13.
 * Source of truth: memory/decisions/2026-05-13-int-token-tasarim-kararlari.md
 * Mirrors Technical Paper §04 tokenomics content under content/technical-paper/.
 */
const data = [
  { name: "User Rewards", value: 65, color: "oklch(0.65 0.24 264)" },
  { name: "Proof of Contribution", value: 10, color: "oklch(0.78 0.15 90)" },
  { name: "Staking Incentives", value: 10, color: "oklch(0.55 0.20 180)" },
  { name: "Liquidity", value: 5, color: "oklch(0.60 0.22 300)" },
  { name: "Airdrop", value: 5, color: "oklch(0.70 0.18 50)" },
  { name: "Referral", value: 5, color: "oklch(0.70 0.18 120)" },
]

export function TokenDistribution() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Token Distribution</CardTitle>
        <p className="text-sm text-muted-foreground">Total supply: 99 Billion INT tokens</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.16 0.01 264)",
                border: "1px solid oklch(0.24 0.01 264)",
                borderRadius: "0.5rem",
                color: "oklch(0.98 0.005 264)",
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
