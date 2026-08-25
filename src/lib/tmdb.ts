export type TmdbMovieResult = {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  overview: string;
  vote_average: number;
  genre_ids: number[];
};

type TmdbSearchResponse = {
  results?: Array<{
    id: number;
    title?: string;
    name?: string;
    release_date?: string;
    poster_path?: string | null;
    overview?: string;
    vote_average?: number;
    genre_ids?: number[];
  }>;
  status_message?: string;
};

const PLACEHOLDER_POSTER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="342" height="513" viewBox="0 0 342 513">
      <rect width="342" height="513" fill="#E8E8E8"/>
      <text x="50%" y="48%" text-anchor="middle" fill="#747878" font-family="monospace" font-size="14">NO POSTER</text>
    </svg>`,
  );

export function getTmdbApiKey(): string | null {
  const key = import.meta.env.VITE_TMDB_API_KEY;
  if (typeof key === "string" && key.trim().length > 0) return key.trim();
  return null;
}

export function hasTmdbApiKey(): boolean {
  return getTmdbApiKey() !== null;
}

export function getPosterUrl(
  posterPath: string | null,
  size: "w342" | "w500" = "w500",
): string {
  if (!posterPath) return PLACEHOLDER_POSTER;
  if (posterPath.startsWith("http://") || posterPath.startsWith("https://")) {
    return posterPath;
  }
  const path = posterPath.startsWith("/") ? posterPath : `/${posterPath}`;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export async function searchMovies(query: string): Promise<TmdbMovieResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const apiKey = getTmdbApiKey();
  if (!apiKey) {
    throw new Error(
      "Missing VITE_TMDB_API_KEY. Add it to a .env file in the project root and restart the dev server.",
    );
  }

  const url = new URL("https://api.themoviedb.org/3/search/movie");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", trimmed);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("language", "en-US");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`TMDB search failed (${res.status})`);
  }

  const json = (await res.json()) as TmdbSearchResponse;
  if (json.status_message && !json.results) {
    throw new Error(json.status_message);
  }

  return (json.results ?? []).map((item) => ({
    id: item.id,
    title: item.title || item.name || "Untitled",
    release_date: item.release_date ?? "",
    poster_path: item.poster_path ?? null,
    overview: item.overview ?? "",
    vote_average: item.vote_average ?? 0,
    genre_ids: item.genre_ids ?? [],
  }));
}
