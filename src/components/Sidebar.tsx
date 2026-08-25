import type { RailView } from "../types";

type Props = {
  view: RailView;
  onViewChange: (view: RailView) => void;
};

const NAV: { id: RailView; label: string; icon: string }[] = [
  { id: "graph", label: "Graph", icon: "hub" },
  { id: "library", label: "Library", icon: "book_2" },
  { id: "search", label: "Search", icon: "search" },
  { id: "archive", label: "Archive", icon: "inventory_2" },
];

export default function Sidebar({ view, onViewChange }: Props) {
  return (
    <nav className="absolute left-3 top-1/2 z-30 flex h-[min(820px,90vh)] w-16 -translate-y-1/2 flex-col items-center rounded-full border border-outline/50 bg-white py-5 shadow-card">
      <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-full border border-outline/60 bg-surface-low font-serif text-lg text-ink">
        ◈
      </div>
      <div className="flex flex-1 flex-col items-center gap-2">
        {NAV.map((item) => (
          <RailIcon
            key={item.id}
            label={item.label}
            icon={item.icon}
            active={view === item.id}
            onClick={() => onViewChange(item.id)}
          />
        ))}
      </div>
      <div className="mt-auto flex flex-col gap-1">
        <RailIcon label="Trash" icon="delete" />
        <RailIcon label="Help" icon="help_outline" />
      </div>
    </nav>
  );
}

function RailIcon({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`group relative rounded-full p-2.5 transition-colors ${
        active ? "bg-[#e2e2e2] text-ink" : "text-secondary hover:bg-surface-low"
      }`}
      style={{ color: active ? "#181919" : "#5e5e5e" }}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="pointer-events-none absolute left-14 z-50 whitespace-nowrap rounded bg-surface-low px-2 py-1 font-mono text-[10px] text-ink opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}
