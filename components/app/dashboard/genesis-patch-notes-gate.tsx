"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  dismissGenesisPatchNotesPermanent,
  shouldShowGenesisPatchNotes,
} from "@/lib/dashboard/genesis-patch-notes";
import { GenesisPatchNotesModal } from "@/components/app/dashboard/genesis-patch-notes-modal";
import { useDemoTour } from "@/lib/demo/tour-context";

export function GenesisPatchNotesGate() {
  const { active: tourActive } = useDemoTour();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!pathname?.endsWith("/dashboard")) return;
    if (shouldShowGenesisPatchNotes()) {
      setOpen(true);
    }
  }, [pathname]);

  const handleDismiss = (dontShowAgain: boolean) => {
    if (dontShowAgain) dismissGenesisPatchNotesPermanent();
    setOpen(false);
  };

  if (tourActive || !open) return null;

  return <GenesisPatchNotesModal open={open} onDismiss={handleDismiss} />;
}
