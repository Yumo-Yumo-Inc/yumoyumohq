"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { User, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { UserStats } from "@/lib/mock/types";

interface LevelProgressCardProps {
  stats: UserStats;
  verifiedCount?: number;
  className?: string;
}

export function LevelProgressCard({ stats, verifiedCount = 0, className }: LevelProgressCardProps) {
  const [progressValue, setProgressValue] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  const currentLevel = Math.floor(verifiedCount / 10) + 1;
  const nextLevelReceipts = stats.nextTierInReceipts;
  const progressPercent = ((15 - nextLevelReceipts) / 15) * 100;

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgressValue(progressPercent);
    }, 300);
    return () => clearTimeout(timer);
  }, [progressPercent]);

  const levelNames = [
    "Novice",
    "Explorer",
    "Miner",
    "Hunter",
    "Master",
    "Elite",
  ];

  const levelName = levelNames[Math.min(currentLevel - 1, levelNames.length - 1)];

  return (
    <Card 
      className={`card-cinematic card-secondary ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Level {currentLevel}</p>
              <p className="font-semibold">{levelName}</p>
            </div>
            <Badge variant="outline" className="text-sm">
              {stats.multiplier}x
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-1 rounded hover:bg-muted transition-colors">
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">
                    Verified receipts give more XP. Each verified receipt moves you closer to the next level and increases your multiplier.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Progress to next level</span>
              <span className="text-muted-foreground tabular-nums">
                {15 - nextLevelReceipts} / 15 receipts
              </span>
            </div>
            <Progress 
              value={progressValue} 
              className="h-3 rounded-full transition-all duration-500"
            />
            <p className="text-xs text-muted-foreground">
              {nextLevelReceipts} receipts to next level
            </p>
            {isHovered && (
              <p className="text-xs text-muted-foreground/70 italic">
                Verified receipts give more XP
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Total Verified</span>
              <span className="font-semibold">{verifiedCount}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
