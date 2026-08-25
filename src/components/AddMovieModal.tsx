import { useEffect, useMemo, useState } from "react";
import {
  getPosterUrl,
  hasTmdbApiKey,
  searchMovies,
  type TmdbMovieResult,
} from "../lib/tmdb";
import type { MovieWatchStatus } from "../types";

export type LoggedMoviePayload = {
  tmdb_id: number;
  title: string;
  release_year: string;
  poster_url: string;
  overview: string;
  vote_average: number;
  genre_ids: number[];
  status: MovieWatchStatus;
  rating: number;
  notes_markdown: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onLog: (movie: LoggedMoviePayload) => void;
};

export default function AddMovieModal({ open, onClose, onLog }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbMovieResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TmdbMovieResult | null>(null);
  const [status, setStatus] = useState<MovieWatchStatus>("watchlist");
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");

  const configured = useMemo(() => hasTmdbApiKey(), []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults([]);
    setLoading(false);
    setError(null);
    setSelected(null);
    setStatus("watchlist");
    setRating(0);
    setNotes("");
  }, [open]);

  useEffect(() => {
    if (!open || selected || !configured) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    const timer = setTimeout(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const movies = await searchMovies(q);
          setResults(movies.slice(0, 16));
        } catch (e) {
          setResults([]);
          setError(e instanceof Error ? e.message : "Search failed");
        } finally {
          setLoading(false);
        }
      })();
    }, 350);

    return () => clearTimeout(timer);
  }, [configured, open, query, selected]);

  if (!open) return null;

  const year = selected?.release_date?.slice(0, 4) ?? "";

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/20 p-6">
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl text-neutral-900">Log a Film</h2>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-neutral-500">
              {selected ? "Step 2 · Details" : "Step 1 · Search TMDB"}
            </p>
          </div>
          <button type="button" className="pill-btn" onClick={onClose}>
            Close
          </button>
        </div>

        {!configured && (
          <div className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 p-4">
            <p className="font-serif text-base text-neutral-800">
              TMDB API key required
            </p>
            <p className="mt-2 font-mono text-xs leading-relaxed text-neutral-600">
              Create a <span className="text-neutral-900">.env</span> file in the
              project root with:
            </p>
            <pre className="mt-3 overflow-x-auto rounded bg-neutral-900 px-3 py-2 font-mono text-[11px] text-white">
              VITE_TMDB_API_KEY=your_key_here
            </pre>
            <p className="mt-2 font-mono text-[10px] text-neutral-500">
              Restart `npm run tauri dev` after saving. Get a key at themoviedb.org.
            </p>
          </div>
        )}

        {configured && !selected && (
          <>
            <div className="mt-4 flex gap-2">
              <input
                autoFocus
                className="flex-1 border-b border-neutral-300 bg-transparent py-2 font-serif text-lg outline-none"
                placeholder="Search movies…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.preventDefault();
                }}
              />
              <button
                type="button"
                className="pill-btn"
                disabled={loading || query.trim().length < 2}
                onClick={() => setQuery((q) => q.trim())}
              >
                {loading ? "…" : "Search"}
              </button>
            </div>
            {error && (
              <p className="mt-3 font-mono text-xs text-red-700">{error}</p>
            )}
            <ul className="mt-4 max-h-[48vh] space-y-2 overflow-auto pr-1">
              {results.map((movie) => {
                const y = movie.release_date?.slice(0, 4) || "—";
                return (
                  <li key={movie.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-md border border-neutral-100 p-2 text-left hover:border-neutral-800"
                      onClick={() => setSelected(movie)}
                    >
                      <img
                        src={getPosterUrl(movie.poster_path, "w342")}
                        alt=""
                        className="h-16 w-11 rounded-sm object-cover bg-neutral-100"
                      />
                      <div className="min-w-0">
                        <div className="truncate font-serif text-base text-neutral-900">
                          {movie.title}
                        </div>
                        <div className="font-mono text-[11px] text-neutral-500">
                          {y}
                          {movie.vote_average
                            ? ` · ★ ${movie.vote_average.toFixed(1)}`
                            : ""}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
              {!loading && query.trim().length >= 2 && results.length === 0 && !error && (
                <li className="font-mono text-xs text-neutral-500">No results</li>
              )}
            </ul>
          </>
        )}

        {configured && selected && (
          <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-auto">
            <button
              type="button"
              className="self-start font-mono text-[10px] uppercase tracking-wide text-neutral-500 hover:text-neutral-900"
              onClick={() => setSelected(null)}
            >
              ← Back to search
            </button>
            <div className="flex gap-4">
              <img
                src={getPosterUrl(selected.poster_path, "w500")}
                alt=""
                className="h-48 w-32 shrink-0 rounded-md object-cover bg-neutral-100 shadow-sm"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-2xl leading-tight text-neutral-900">
                  {selected.title}
                </h3>
                <p className="mt-1 font-mono text-[11px] text-neutral-500">
                  {year || "Year unknown"}
                  {selected.vote_average
                    ? ` · TMDB ★ ${selected.vote_average.toFixed(1)}`
                    : ""}
                </p>
                {selected.overview && (
                  <p className="mt-3 line-clamp-5 font-serif text-sm italic leading-relaxed text-neutral-600">
                    {selected.overview}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(["watched", "watchlist"] as MovieWatchStatus[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-wide ${
                    status === value
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-800 text-neutral-800"
                  }`}
                  onClick={() => setStatus(value)}
                >
                  {value === "watched" ? "Watched" : "Watchlist"}
                </button>
              ))}
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-wide text-neutral-500">
                Your rating
              </div>
              <div className="mt-1 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`text-lg ${
                      star <= rating ? "text-neutral-900" : "text-neutral-300"
                    }`}
                    onClick={() => setRating(star === rating ? 0 : star)}
                    aria-label={`${star} stars`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-wide text-neutral-500">
                Takeaways / annotations
              </span>
              <textarea
                className="mt-2 h-28 w-full resize-none rounded-md border border-neutral-200 bg-neutral-50 p-3 font-mono text-xs leading-relaxed outline-none focus:border-neutral-800"
                placeholder="Markdown notes…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>

            <div className="mt-auto flex justify-end gap-2 pt-2">
              <button type="button" className="pill-btn" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-neutral-900 px-4 py-1.5 font-mono text-xs text-white"
                onClick={() => {
                  onLog({
                    tmdb_id: selected.id,
                    title: selected.title,
                    release_year: year,
                    poster_url: getPosterUrl(selected.poster_path, "w500"),
                    overview: selected.overview,
                    vote_average: selected.vote_average,
                    genre_ids: selected.genre_ids,
                    status,
                    rating,
                    notes_markdown: notes,
                  });
                }}
              >
                Log Film
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
