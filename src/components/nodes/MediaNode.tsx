import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { useMemo, useState } from "react";
import { useArchiveActions } from "../../lib/archive-context";
import type { MediaNodeData } from "../../types";

function readMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default function MediaNode({ id, data }: NodeProps<Node<MediaNodeData>>) {
  const actions = useArchiveActions();
  const { media } = data;
  const [open, setOpen] = useState(false);
  const meta = useMemo(() => {
    try {
      return JSON.parse(media.metadata_json || "{}") as {
        description?: string;
        site_name?: string;
        duration?: string;
        year?: string;
        rating?: number;
      };
    } catch {
      return {};
    }
  }, [media.metadata_json]);

  const excerpt = String(meta.description || media.notes_markdown || "");

  const kind = media.media_type;

  return (
    <article
      className={`archive-card overflow-hidden ${
        kind === "instagram" || kind === "movie" ? "w-[260px]" : "w-[320px]"
      }`}
    >
      <Handle type="target" position={Position.Top} className="archive-handle" />

      {kind === "youtube" && (
        <div>
          <div className="relative aspect-video bg-surface-low">
            {media.cover_image_url && (
              <img
                src={media.cover_image_url}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
            {meta.duration && (
              <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white">
                {meta.duration}
              </span>
            )}
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-serif text-2xl font-medium leading-snug text-ink">
                {media.title}
              </h3>
              {media.url && (
                <a
                  href={media.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 text-neutral-500"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              )}
            </div>
            <span className="pill mt-3 inline-block">
              @{media.creator_or_author || meta.site_name || "channel"}
            </span>
            <button
              type="button"
              className="mt-4 flex items-center gap-1 border-t border-outline/40 pt-3 font-mono text-[11px] text-neutral-500"
              onClick={() => setOpen((v) => !v)}
            >
              <span
                className={`material-symbols-outlined text-base transition-transform ${
                  open ? "rotate-90" : ""
                }`}
              >
                chevron_right
              </span>
              Expand Annotations
            </button>
            {open && (
              <textarea
                className="nodrag nowheel mt-2 h-16 w-full resize-none bg-transparent font-mono text-[11px] outline-none"
                value={media.notes_markdown}
                placeholder="02:30 — note..."
                onChange={(e) =>
                  actions.updateMedia(media.id, { notes_markdown: e.target.value })
                }
              />
            )}
          </div>
        </div>
      )}

      {kind === "movie" && (
        <div className="p-5 text-center">
          <div className="mb-4 overflow-hidden rounded-lg bg-surface-low shadow-sm">
            {media.cover_image_url ? (
              <img
                src={media.cover_image_url}
                alt=""
                className="aspect-[2/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[2/3] items-center justify-center font-mono text-[10px] text-neutral-500">
                POSTER
              </div>
            )}
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            {[meta.year, media.genre].filter(Boolean).join(" • ")}
          </p>
          <h3 className="mt-1 font-serif text-[28px] font-medium leading-tight text-ink">
            {media.title}
          </h3>
          <p className="mt-1 font-sans text-sm text-neutral-500">
            {media.creator_or_author ? `Dir. ${media.creator_or_author}` : "Director unknown"}
          </p>
          <div className="mt-3 flex justify-center gap-0.5 text-ink">
            {[1, 2, 3, 4, 5].map((star) => {
              const rating = Number(meta.rating) || 0;
              return (
                <button
                  key={star}
                  type="button"
                  className="nodrag"
                  onClick={() =>
                    actions.updateMedia(media.id, {
                      metadata_json: JSON.stringify({ ...meta, rating: star }),
                    })
                  }
                  aria-label={`${star} stars`}
                >
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{
                      fontVariationSettings: `'FILL' ${star <= rating ? 1 : 0}`,
                      color: star <= rating ? "#181919" : "#c4c7c7",
                    }}
                  >
                    star
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {(kind === "article" || kind === "substack" || kind === "generic") && (
        <div className="p-6">
          <div className="flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wide text-neutral-500">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">article</span>
              {media.creator_or_author || meta.site_name || "WEB"}
            </span>
            <span className="rounded bg-[#e8e8e8] px-2 py-1 text-[10px] text-neutral-600">
              {readMinutes(excerpt || media.title)} MIN READ
            </span>
          </div>
          <h3 className="mt-4 font-serif text-2xl font-medium leading-snug text-ink">
            {media.title}
          </h3>
          {excerpt && (
            <blockquote className="mt-4 border-l-2 border-outline pl-4 font-serif text-base italic leading-relaxed text-neutral-600">
              {excerpt.slice(0, 220)}
            </blockquote>
          )}
          {media.genre && (
            <div className="mt-4 flex flex-wrap gap-2">
              {media.genre.split(",").map((g) => (
                <span key={g} className="pill">
                  {g.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {kind === "instagram" && (
        <div className="p-3">
          <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-surface-low">
            {media.cover_image_url ? (
              <img
                src={media.cover_image_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center font-mono text-[10px] text-neutral-500">
                VISUAL
              </div>
            )}
            <div className="absolute left-3 top-3 flex items-center gap-1 rounded bg-white/90 px-2 py-1 font-mono text-[11px] text-ink shadow-sm backdrop-blur">
              <span className="material-symbols-outlined text-sm">play_circle</span>
              @{media.creator_or_author || "creator"}
            </div>
          </div>
          <button
            type="button"
            className="mt-3 flex w-full items-center justify-between rounded-lg bg-surface-low px-3 py-2 font-mono text-[11px] text-ink"
            onClick={() => setOpen((v) => !v)}
          >
            Saved Note
            <span className="material-symbols-outlined text-sm">
              {open ? "expand_less" : "expand_more"}
            </span>
          </button>
          {open && (
            <textarea
              className="nodrag nowheel mt-2 h-16 w-full resize-none bg-transparent font-sans text-sm outline-none"
              value={media.notes_markdown}
              placeholder="Caption notes..."
              onChange={(e) =>
                actions.updateMedia(media.id, { notes_markdown: e.target.value })
              }
            />
          )}
        </div>
      )}

      {kind !== "youtube" && kind !== "instagram" && (
        <div className="border-t border-outline/30 px-4 py-2">
          <button
            type="button"
            className="font-mono text-[10px] uppercase tracking-wide text-neutral-400 hover:text-ink"
            onClick={() => actions.deleteNode(id)}
          >
            Remove
          </button>
        </div>
      )}
      {(kind === "youtube" || kind === "instagram") && (
        <div className="px-4 pb-3">
          <button
            type="button"
            className="font-mono text-[10px] uppercase tracking-wide text-neutral-400 hover:text-ink"
            onClick={() => actions.deleteNode(id)}
          >
            Remove
          </button>
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="archive-handle" />
    </article>
  );
}
