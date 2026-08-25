import { useState } from "react";
import type { OpenLibraryDoc } from "../types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (doc: OpenLibraryDoc) => void;
};

export default function OpenLibraryModal({ open, onClose, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OpenLibraryDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query.trim())}`,
      );
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const json = (await res.json()) as { docs?: OpenLibraryDoc[] };
      setResults((json.docs ?? []).slice(0, 12));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/20 p-6">
      <div className="w-full max-w-xl rounded-xl border border-neutral-200 bg-white p-6 shadow-card">
        <h2 className="font-serif text-3xl">Open Library</h2>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-neutral-500">
          Search by title or ISBN
        </p>
        <div className="mt-4 flex gap-2">
          <input
            className="flex-1 border-b border-neutral-300 bg-transparent py-1 font-serif text-lg outline-none"
            value={query}
            placeholder="Dune, 978..."
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void search();
            }}
          />
          <button type="button" className="pill-btn" onClick={() => void search()}>
            Search
          </button>
        </div>
        {loading && (
          <p className="mt-4 font-mono text-xs text-neutral-500">Searching…</p>
        )}
        {error && <p className="mt-4 font-mono text-xs text-red-700">{error}</p>}
        <ul className="mt-4 max-h-80 space-y-2 overflow-auto">
          {results.map((doc) => (
            <li key={doc.key ?? `${doc.title}-${doc.cover_i}`}>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-md border border-neutral-100 p-2 text-left hover:border-neutral-800"
                onClick={() => onSelect(doc)}
              >
                {doc.cover_i ? (
                  <img
                    src={`https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`}
                    alt=""
                    className="h-16 w-11 object-cover"
                  />
                ) : (
                  <div className="h-16 w-11 bg-neutral-200" />
                )}
                <div>
                  <div className="font-serif text-base">{doc.title}</div>
                  <div className="font-mono text-[11px] text-neutral-500">
                    {(doc.author_name ?? []).slice(0, 2).join(", ")}
                    {doc.first_publish_year ? ` · ${doc.first_publish_year}` : ""}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-end">
          <button type="button" className="pill-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
