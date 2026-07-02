"use client";

interface PrimaryCtaButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function PrimaryCtaButton({ label, onClick, disabled = false }: PrimaryCtaButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl px-4 py-3.5 text-sm font-semibold disabled:opacity-50"
      style={{
        background: "linear-gradient(135deg, var(--app-gold), var(--app-gold-dim))",
        color: "#0a0a0a",
        boxShadow: "var(--app-shadow-cta)",
      }}
    >
      {label}
    </button>
  );
}
