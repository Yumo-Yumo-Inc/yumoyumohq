"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Sparkles } from "lucide-react";
import type { Quest } from "@/lib/mock/types";
import { useAppLocale } from "@/lib/i18n/app-context";

interface ActiveQuestsCardProps {
  quests: Quest[];
  className?: string;
}

export function ActiveQuestsCard({ quests, className }: ActiveQuestsCardProps) {
  const { t } = useAppLocale();
  // Filter to show only incomplete quests, limit to 3
  const activeQuests = quests
    .filter(q => !q.completed)
    .slice(0, 3);

  if (activeQuests.length === 0) {
    return (
      <Card className={`card-cinematic card-secondary ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">{t("quests.active")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Badge variant="outline" className="text-xs text-muted-foreground/80 border-muted-foreground/50 bg-muted/30 font-semibold">
            {t("quests.notActive")}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`card-cinematic card-secondary ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{t("quests.active")}</CardTitle>
          <Badge variant="outline" className="text-xs text-muted-foreground/80 border-muted-foreground/50 bg-muted/30 font-semibold">
            {t("quests.notActive")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3 opacity-50">
        {activeQuests.map((quest) => {
          const progressPercent = quest.target > 0 
            ? Math.min((quest.progress / quest.target) * 100, 100) 
            : 0;
          
          return (
            <div key={quest.id} className="space-y-2 pb-3 border-b border-border/50 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <h4 className="text-xs font-semibold truncate">{quest.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{quest.description}</p>
                </div>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {quest.rewardText}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {quest.progress} / {quest.target}
                  </span>
                  <span className="text-muted-foreground">
                    {progressPercent.toFixed(0)}%
                  </span>
                </div>
                <Progress value={progressPercent} className="h-1.5" />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}





