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
      return JSON.parse(media.metadata_json || "{}") as Record<string, string>;
    } catch {
      return {} as Record<string, string>;
    }
  }, [media.metadata_json]);

  const kind = media.media_type;

  return (
    <article
      className={`archive-card overflow-hidden ${
        kind === "instagram" || kind === "movie" ? "w-[240px]" : "w-[300px]"
      }`}
    >
      <Handle type="target" position={Position.Top} className="archive-handle" />

      {kind === "youtube" && (
        <div>
          <div className="relative aspect-video bg-neutral-200">
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
          <div className="p-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-serif text-lg leading-snug">{media.title}</h3>
              {media.url && (
                <a
                  href={media.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 font-mono text-xs text-neutral-500"
                >
                  ↗
                </a>
              )}
            </div>
            <span className="pill mt-2 inline-block">
              @{media.creator_or_author || meta.site_name || "channel"}
            </span>
          </div>
        </div>
      )}

      {kind === "movie" && (
        <div className="p-3">
          <div className="mb-3 overflow-hidden rounded-sm bg-neutral-200">
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
          <p className="font-mono text-[10px] uppercase tracking-wide text-neutral-500">
            {[meta.year, media.genre].filter(Boolean).join(" • ")}
          </p>
          <h3 className="mt-1 font-serif text-xl leading-tight">{media.title}</h3>
          <p className="mt-1 font-mono text-[11px] text-neutral-500">
            {media.creator_or_author ? `Dir. ${media.creator_or_author}` : "Director unknown"}
          </p>
        </div>
      )}

      {(kind === "article" || kind === "substack" || kind === "generic") && (
        <div className="p-4">
          <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-wide text-neutral-500">
            <span>{media.creator_or_author || meta.site_name || "WEB"}</span>
            <span className="pill">
              {readMinutes(media.notes_markdown || meta.description || media.title)} MIN READ
            </span>
          </div>
          <h3 className="mt-3 font-serif text-xl leading-snug">{media.title}</h3>
          {(meta.description || media.notes_markdown) && (
            <blockquote className="mt-3 border-l border-neutral-300 pl-3 font-serif text-sm italic text-neutral-600">
              {(meta.description || media.notes_markdown).slice(0, 180)}
            </blockquote>
          )}
          {media.genre && (
            <div className="mt-3 flex flex-wrap gap-1.5">
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
        <div>
          <div className="flex items-center gap-2 px-3 pt-3 font-mono text-[11px] text-neutral-600">
            <span>▶</span>
            <span>@{media.creator_or_author || "creator"}</span>
          </div>
          <div className="mt-2 aspect-[9/16] bg-neutral-200">
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
          </div>
        </div>
      )}

      <div className="border-t border-neutral-100 px-3 py-2">
        <button
          type="button"
          className="font-mono text-[10px] uppercase tracking-wide text-neutral-500"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide annotations" : "Expand annotations"}
        </button>
        {open && (
          <textarea
            className="nodrag nowheel mt-2 h-16 w-full resize-none bg-transparent font-mono text-[11px] outline-none"
            value={media.notes_markdown}
            placeholder="Timestamp notes, captions..."
            onChange={(e) =>
              actions.updateMedia(media.id, { notes_markdown: e.target.value })
            }
          />
        )}
        <button
          type="button"
          className="mt-1 block font-mono text-[10px] uppercase tracking-wide text-neutral-400 hover:text-neutral-800"
          onClick={() => actions.deleteNode(id)}
        >
          Remove
        </button>
      </div>
      <Handle type="source" position={Position.Bottom} className="archive-handle" />
    </article>
  );
}
