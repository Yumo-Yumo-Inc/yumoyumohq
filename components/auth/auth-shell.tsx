import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthShellFeature {
  title: string;
  body: string;
}

interface AuthShellProps {
  badge: string;
  headline: string;
  subheadline: string;
  icon: ReactNode;
  title: string;
  description: string;
  features: AuthShellFeature[];
  children: ReactNode;
}

export function AuthShell({
  badge,
  headline: _headline,
  subheadline: _subheadline,
  icon,
  title,
  description,
  features: _features,
  children,
}: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(201,168,76,0.18),_transparent_36%),linear-gradient(180deg,_#0f1117_0%,_#111827_52%,_#090b10_100%)] px-4 py-10">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.2),transparent_55%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="w-full max-w-xl">
          <Card className="border-white/10 bg-[#121725]/95 text-white shadow-2xl shadow-black/30">
            <CardHeader className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-app-gold/25 bg-app-gold/10 px-3 py-1.5 text-xs font-medium text-app-gold-light">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-lg bg-app-gold/15 text-app-gold">
                  {icon}
                </span>
                <span>{badge}</span>
              </div>
              <CardTitle className="text-3xl">{title}</CardTitle>
              <CardDescription className="text-sm leading-6 text-white/60">
                {description}
              </CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
