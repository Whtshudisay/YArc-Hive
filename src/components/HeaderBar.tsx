import type { FilterId } from "../types";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "ALL" },
  { id: "notes", label: "NOTES" },
  { id: "books", label: "BOOKS" },
  { id: "videos", label: "VIDEOS" },
  { id: "cinema", label: "CINEMA" },
  { id: "articles", label: "ARTICLES" },
  { id: "wishlist", label: "WISHLIST" },
];

type Props = {
  filter: FilterId;
  onFilter: (id: FilterId) => void;
  onAddNote: () => void;
  onAddBook: () => void;
  onDropUrl: () => void;
  onImportNotes: () => void;
};

export default function HeaderBar({
  filter,
  onFilter,
  onAddNote,
  onAddBook,
  onDropUrl,
  onImportNotes,
}: Props) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col items-center gap-4 px-6 pt-6">
      <h1 className="font-serif text-4xl text-neutral-900 md:text-5xl">
        Welcome to my library
      </h1>
      <nav className="pointer-events-auto flex items-center gap-1 rounded-full border border-neutral-200/80 bg-white/90 px-2 py-1 shadow-sm backdrop-blur">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onFilter(item.id)}
            className={`rounded-full px-3 py-1 font-mono text-[11px] tracking-wide ${
              filter === item.id
                ? "text-neutral-900 underline decoration-2 underline-offset-4"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="pointer-events-auto flex flex-wrap justify-center gap-2">
        <button type="button" className="pill-btn" onClick={onAddNote}>
          + Add Note
        </button>
        <button type="button" className="pill-btn" onClick={onAddBook}>
          + Add Book
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
