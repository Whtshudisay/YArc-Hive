type Props = {
  onNewEntry: () => void;
};

export default function Sidebar({ onNewEntry }: Props) {
  return (
    <nav className="absolute left-3 top-1/2 z-30 flex h-[min(820px,90vh)] w-16 -translate-y-1/2 flex-col items-center rounded-full border border-outline/50 bg-white py-5 shadow-card">
      <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-full border border-outline/60 bg-surface-low font-serif text-lg text-ink">
        ◈
      </div>
      <div className="flex flex-1 flex-col items-center gap-2">
        <RailIcon label="Graph" active icon="hub" />
        <RailIcon label="Library" icon="book_2" />
        <RailIcon label="Search" icon="search" />
        <RailIcon label="Archive" icon="inventory_2" />
      </div>
      <button
        type="button"
        onClick={onNewEntry}
        className="mb-4 mt-2 rounded-full border border-ink px-2 py-2 font-sans text-[10px] font-medium tracking-wide text-ink hover:bg-ink hover:text-white"
        title="New entry"
      >
        <span className="material-symbols-outlined text-sm">add</span>
      </button>
      <div className="flex flex-col gap-1">
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
}: {
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      className={`group relative rounded-full p-2.5 transition-colors ${
        active ? "bg-[#e2e2e2] text-ink" : "text-secondary hover:bg-surface-low"
      }`}
      style={{ color: active ? "#181919" : "#5e5e5e" }}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="pointer-events-none absolute left-14 whitespace-nowrap rounded bg-surface-low px-2 py-1 font-mono text-[10px] text-ink opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}
