import type { FilterId, RailView } from "../types";
import type { ThemeMode } from "../lib/theme";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "notes", label: "Notes" },
  { id: "books", label: "Books" },
  { id: "videos", label: "Videos" },
  { id: "cinema", label: "Cinema" },
  { id: "articles", label: "Articles" },
  { id: "wishlist", label: "Wishlist" },
];

type Props = {
  view: RailView;
  filter: FilterId;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onFilter: (id: FilterId) => void;
  onAddNote: () => void;
  onAddBook: () => void;
  onDropUrl: () => void;
  onLogFilm: () => void;
  onImportNotes: () => void;
};

export default function HeaderBar({
  view,
  filter,
  theme,
  onToggleTheme,
  onFilter,
  onAddNote,
  onAddBook,
  onDropUrl,
  onLogFilm,
  onImportNotes,
}: Props) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 px-canvas pt-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-[32px] font-medium leading-none tracking-tight text-ink">
          Archive
        </h1>
        {view === "graph" ? (
          <nav className="pointer-events-auto flex items-center gap-1 rounded-full border border-outline/60 bg-card/90 px-4 py-2 shadow-sm backdrop-blur-md">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onFilter(item.id)}
                className={`px-3 py-1 font-sans text-sm transition-colors ${
                  filter === item.id
                    ? "border-b-2 border-ink font-semibold text-ink"
                    : "text-muted hover:text-ink"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        ) : (
          <div className="pointer-events-none font-mono text-[11px] uppercase tracking-widest text-muted">
            {view}
          </div>
        )}
        <div className="pointer-events-auto flex items-center gap-3 text-muted">
          <button
            type="button"
            className="hover:text-ink"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={onToggleTheme}
          >
            <span className="material-symbols-outlined">
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
          </button>
          <button type="button" className="hover:text-ink" title="Settings">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="h-9 w-9 rounded-full border border-outline bg-surface-low" />
        </div>
      </div>
      <div className="pointer-events-auto mt-4 flex flex-wrap justify-center gap-2">
        <button type="button" className="pill-btn" onClick={onAddNote}>
          + Add Note
        </button>
        <button type="button" className="pill-btn" onClick={onAddBook}>
          + Add Book
        </button>
        <button type="button" className="pill-btn" onClick={onLogFilm}>
          + Log Film
        </button>
        <button type="button" className="pill-btn" onClick={onDropUrl}>
          + Drop URL
        </button>
        <button type="button" className="pill-btn" onClick={onImportNotes}>
          Import Apple Notes
        </button>
      </div>
    </header>
  );
}
