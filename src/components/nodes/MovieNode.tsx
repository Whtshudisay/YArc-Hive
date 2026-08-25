import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { useMemo, useState } from "react";
import { useArchiveActions } from "../../lib/archive-context";
import { parseMovieMeta } from "../../lib/movie-meta";
import type { MovieNodeData, MovieWatchStatus } from "../../types";

export default function MovieNode({ id, data }: NodeProps<Node<MovieNodeData>>) {
  const actions = useArchiveActions();
  const { media } = data;
  const [open, setOpen] = useState(false);
  const meta = useMemo(() => parseMovieMeta(media.metadata_json), [media.metadata_json]);
  const status: MovieWatchStatus = meta.status ?? "watchlist";
  const rating = meta.rating ?? 0;
  const year = meta.year || "";

  const toggleStatus = () => {
    const next: MovieWatchStatus =
      status === "watched" ? "watchlist" : "watched";
    actions.updateMedia(media.id, {
      metadata_json: JSON.stringify({ ...meta, status: next }),
    });
  };

  return (
    <article className="w-[260px] overflow-hidden rounded-md border border-outline/50 bg-card shadow-md">
      <Handle type="target" position={Position.Top} className="archive-handle" />

      <div className="relative aspect-[2/3] bg-surface-low">
        {media.cover_image_url ? (
          <img
            src={media.cover_image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-[10px] text-muted">
            NO POSTER
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          <button
            type="button"
            className="nodrag rounded-full border border-white/70 bg-black/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-white backdrop-blur"
            onClick={toggleStatus}
          >
            {status === "watched" ? "Watched" : "Wishlist"}
          </button>
          {year && (
            <span className="rounded-full border border-white/70 bg-card/90 px-2 py-0.5 font-mono text-[10px] text-ink">
              {year}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-serif text-xl font-medium leading-tight text-ink">
          {media.title}
        </h3>
        {(media.creator_or_author || meta.overview) && (
          <p className="mt-2 line-clamp-3 font-serif text-sm italic leading-relaxed text-muted">
            {media.creator_or_author
              ? `Dir. ${media.creator_or_author}`
              : meta.overview}
          </p>
        )}

        <div className="mt-3 flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`nodrag text-sm ${
                star <= rating ? "text-ink" : "text-muted/50"
              }`}
              onClick={() =>
                actions.updateMedia(media.id, {
                  metadata_json: JSON.stringify({ ...meta, rating: star }),
                })
              }
              aria-label={`${star} stars`}
            >
              ★
            </button>
          ))}
        </div>

        <button
          type="button"
          className="mt-3 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide text-muted"
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={`material-symbols-outlined text-base transition-transform ${
              open ? "rotate-90" : ""
            }`}
          >
            chevron_right
          </span>
          {open ? "Hide notes" : "Expand notes"}
        </button>
        {open && (
          <textarea
            className="nodrag nowheel mt-2 h-20 w-full resize-none rounded border border-outline/50 bg-surface-low p-2 font-mono text-[11px] outline-none"
            value={media.notes_markdown}
            placeholder="Takeaways…"
            onChange={(e) =>
              actions.updateMedia(media.id, { notes_markdown: e.target.value })
            }
          />
        )}

        <button
          type="button"
          className="mt-3 block font-mono text-[10px] uppercase tracking-wide text-muted hover:text-ink"
          onClick={() => actions.deleteNode(id)}
        >
          Remove
        </button>
      </div>

      <Handle type="source" position={Position.Bottom} className="archive-handle" />
    </article>
  );
}
