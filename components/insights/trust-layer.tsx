"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { TrustCounts } from "@/lib/insights/types";
import { useAppLocale } from "@/lib/i18n/app-context";

interface TrustLayerProps {
  trustCounts: TrustCounts;
}

export function TrustLayer({ trustCounts }: TrustLayerProps) {
  const { t } = useAppLocale();
  const data = [
    {
      name: t("insights.trustLayer.verified"),
      value: trustCounts.verified,
      color: "hsl(150, 70%, 50%)",
      icon: CheckCircle2,
    },
    {
      name: t("insights.trustLayer.lowConfidence"),
      value: trustCounts.low,
      color: "hsl(40, 100%, 55%)",
      icon: AlertTriangle,
    },
    {
      name: t("status.rejected"),
      value: trustCounts.rejected,
      color: "hsl(0, 84%, 60%)",
      icon: XCircle,
    },
  ].filter((item) => item.value > 0);

  const insightText =
    trustCounts.total > 0
      ? trustCounts.low > 0
        ? t("insights.trustLayer.onlyVerified", { 
            count: trustCounts.low, 
            plural: trustCounts.low !== 1 ? "s" : "" 
          })
        : t("insights.trustLayer.allVerified")
      : t("insights.trustLayer.noReceipts");

  return (
    <Card className="card-cinematic">
      <CardHeader>
        <CardTitle>{t("insights.trustLayer.title")}</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">{insightText}</p>
      </CardHeader>
      <CardContent>
        {trustCounts.total > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={data}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="grid grid-cols-3 gap-4">
                {data.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" style={{ color: item.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {item.value} receipt{item.value !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t("insights.trustLayer.noData")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}





