"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { ProfileWorkspace } from "@/components/app/profile-workspace";
import { useAppProfile } from "@/lib/app/profile-context";

interface ProfileModalProps {
  onClose: () => void;
}

export function ProfileModal({ onClose }: ProfileModalProps) {
  const { profile } = useAppProfile();
  const accountLevel = profile?.accountLevel ?? 1;
  const [visible, setVisible] = useState(false);

  const closeModal = useCallback(() => {
    setVisible(false);
    window.setTimeout(onClose, 220);
  }, [onClose]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeModal]);

  return (
    <>
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-md transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeModal}
      />

      <div className="fixed inset-0 z-[51] flex items-end justify-center p-2 sm:p-4 lg:items-center lg:p-6">
        <div
          role="dialog"
          aria-modal="true"
          className={`relative flex h-[min(88svh,760px)] max-h-[calc(100svh-1rem)] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[28px] border bg-[var(--app-bg-shell)] shadow-2xl transition-all duration-200 sm:rounded-[28px] lg:h-[min(86vh,920px)] lg:max-w-[1180px] ${
            visible
              ? "translate-y-0 opacity-100 lg:scale-100"
              : "translate-y-6 opacity-0 lg:translate-y-0 lg:scale-[0.985]"
          }`}
          style={{
            borderColor:
              accountLevel > 1 ? "rgba(201,168,76,0.18)" : "var(--app-border)",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
          }}
        >
          <div
            className="flex items-center justify-between border-b px-5 py-4 lg:px-6"
            style={{ borderColor: "var(--app-border)", background: "rgba(15,17,23,0.92)" }}
          >
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--app-text-muted)" }}>
                Profile
              </p>
              <h2 className="mt-1 text-lg font-semibold" style={{ color: "var(--app-text-primary)" }}>
                Desktop profile panel
              </h2>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-white/[0.04]"
              style={{ borderColor: "var(--app-border)", color: "var(--app-text-secondary)" }}
              aria-label="Close profile panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            <ProfileWorkspace variant="modal" onDone={closeModal} />
          </div>
        </div>
      </div>
    </>
  );
}
