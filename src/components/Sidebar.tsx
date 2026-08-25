type Props = {
  onNewEntry: () => void;
};

export default function Sidebar({ onNewEntry }: Props) {
  return (
    <aside className="relative z-20 flex w-[220px] shrink-0 flex-col border-r border-neutral-200/70 bg-[#F3F2EE] px-4 py-5">
      <div className="mb-6">
        <div className="mb-2 text-neutral-800">◈</div>
        <div className="font-serif text-2xl leading-none">Workspace</div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          Personal Archive
        </div>
      </div>
      <button
        type="button"
        onClick={onNewEntry}
        className="mb-6 rounded-full bg-neutral-800 px-4 py-2 font-mono text-xs text-white"
      >
        + New Entry
      </button>
      <nav className="flex flex-col gap-1 font-mono text-xs text-neutral-600">
        <span className="rounded-md bg-white px-3 py-2 text-neutral-900 shadow-sm">
          Graph
        </span>
        <span className="px-3 py-2 text-neutral-400">Library</span>
        <span className="px-3 py-2 text-neutral-400">Search</span>
        <span className="px-3 py-2 text-neutral-400">Archive</span>
      </nav>
      <div className="mt-auto flex flex-col gap-2 font-mono text-xs text-neutral-500">
        <span>Settings</span>
        <span>Help</span>
      </div>
    </aside>
  );
}
