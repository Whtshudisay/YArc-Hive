import type { MovieMeta, MovieWatchStatus } from "../types";

export function parseMovieMeta(raw: string): MovieMeta {
  try {
    const parsed = JSON.parse(raw || "{}") as Partial<MovieMeta>;
    const status: MovieWatchStatus | undefined =
      parsed.status === "watched" || parsed.status === "watchlist"
        ? parsed.status
        : undefined;
    return {
      year: typeof parsed.year === "string" ? parsed.year : undefined,
      tmdb_id: typeof parsed.tmdb_id === "number" ? parsed.tmdb_id : undefined,
      status,
      rating: typeof parsed.rating === "number" ? parsed.rating : undefined,
      overview: typeof parsed.overview === "string" ? parsed.overview : undefined,
      vote_average:
        typeof parsed.vote_average === "number" ? parsed.vote_average : undefined,
      genre_ids: Array.isArray(parsed.genre_ids) ? parsed.genre_ids : undefined,
    };
  } catch {
    return {};
  }
}
