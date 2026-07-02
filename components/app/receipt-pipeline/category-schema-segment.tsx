"use client";

interface SchemaOption {
  value: string;
  label: string;
}

interface CategorySchemaSegmentProps {
  options: SchemaOption[];
  active: string;
  onChange: (value: string) => void;
}

export function CategorySchemaSegment({ options, active, onChange }: CategorySchemaSegmentProps) {
  return (
    <div
      className="flex gap-1 rounded-2xl p-1"
      style={{
        background: "var(--receipt-card-bg, var(--app-bg-surface))",
        border: "1px solid var(--receipt-card-border, var(--app-border))",
      }}
    >
      {options.map((option) => {
        const selected = option.value === active;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className="flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
            style={{
              background: selected ? "var(--app-gold-glow)" : "transparent",
              border: selected ? "1px solid var(--app-gold-border)" : "1px solid transparent",
              color: selected ? "var(--app-gold-light)" : "var(--app-text-muted)",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
