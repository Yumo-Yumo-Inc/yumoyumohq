"use client";

/**
 * YumbieRoomModal — the full Yumbie room, lifted out of the dashboard band into
 * a dialog. Same scene, same furniture, same behaviors (work replay, "!" cue,
 * weekly tour, chat panel below the stage) — the workspace component is mounted
 * unchanged inside the modal. The mini companion on the dashboard opens it.
 */
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { YumbieWorkspace } from "./YumbieWorkspace";

interface YumbieRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function YumbieRoomModal({ open, onOpenChange }: YumbieRoomModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Above the app's z-9999 overlay layer so nothing renders over it. */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-[10010] bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-[10011] max-h-[90svh] w-[min(560px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[28px] border border-[var(--app-border-strong)] bg-[var(--app-bg-base)] shadow-[0_30px_90px_rgba(0,0,0,0.55)] outline-none duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          {/* Header. */}
          <div className="flex items-center justify-between px-4 pb-2 pt-3">
            <DialogPrimitive.Title className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--app-text-muted)]">
              Yumbie
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-bg-elevated)] text-[var(--app-text-secondary)] transition hover:text-[var(--app-text-primary)] active:scale-95"
            >
              <X className="h-4 w-4" strokeWidth={2.4} />
            </DialogPrimitive.Close>
          </div>
          {/* Mount the engine only while open so the rAF loop never runs hidden. */}
          {open && <YumbieWorkspace sceneId="today" />}
          <div className="h-3" aria-hidden />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
