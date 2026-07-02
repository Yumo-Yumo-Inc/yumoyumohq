"use client";

export interface RailItem {
  label: string;
  detail: string;
  status: "completed" | "in_progress" | "pending";
}

interface ReceiptProgressRailProps {
  items: RailItem[];
}

const STATUS_COLOR: Record<RailItem["status"], string> = {
  completed: "var(--app-success)",
  in_progress: "var(--app-gold)",
  pending: "var(--app-text-muted)",
};

export function ReceiptProgressRail({ items }: ReceiptProgressRailProps) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="relative pl-4">
          {index < items.length - 1 ? (
            <span
              className="absolute left-[5px] top-4 h-[calc(100%+4px)] w-px"
              style={{ background: "var(--app-border)" }}
            />
          ) : null}
          <span
            className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full"
            style={{ background: STATUS_COLOR[item.status] }}
          />
          <p className="text-[11px] font-medium leading-tight" style={{ color: "var(--app-text-primary)" }}>
            {item.label}
          </p>
          <p className="text-[10px]" style={{ color: "var(--app-text-muted)" }}>
            {item.detail}
          </p>
        </div>
      ))}
    </div>
  );
}
