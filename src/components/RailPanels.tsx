import { useMemo, useState } from "react";
import type { Node } from "@xyflow/react";
import { parseMovieMeta } from "../lib/movie-meta";
import type { ArchiveNodeData, RailView } from "../types";

export type CatalogEntry = {
  nodeId: string;
  kind: "note" | "book" | "movie" | "video" | "article" | "media";
  title: string;
  subtitle: string;
  thumb?: string;
  status?: string;
};

export function catalogFromNodes(nodes: Node<ArchiveNodeData>[]): CatalogEntry[] {
  return nodes.map((node) => {
    const data = node.data;
    if (data.itemType === "note") {
      return {
        nodeId: node.id,
        kind: "note" as const,
        title: data.note.title || "Untitled note",
        subtitle: data.note.content.slice(0, 80) || "Note",
      };
    }
    if (data.itemType === "book") {
      return {
        nodeId: node.id,
        kind: "book" as const,
        title: data.book.title,
        subtitle: data.book.author || "Book",
        thumb: data.book.cover_url || undefined,
        status: data.book.status,
      };
    }
    if (data.itemType === "movie") {
      const meta = parseMovieMeta(data.media.metadata_json);
      return {
        nodeId: node.id,
        kind: "movie" as const,
        title: data.media.title,
        subtitle: [meta.year, data.media.creator_or_author]
          .filter(Boolean)
          .join(" · ") || "Film",
        thumb: data.media.cover_image_url || undefined,
        status: meta.status,
      };
    }
    const mediaKind =
      data.media.media_type === "youtube"
        ? ("video" as const)
        : data.media.media_type === "article" ||
            data.media.media_type === "substack" ||
            data.media.media_type === "generic"
          ? ("article" as const)
          : ("media" as const);
    return {
      nodeId: node.id,
      kind: mediaKind,
      title: data.media.title,
      subtitle: data.media.creator_or_author || data.media.media_type,
      thumb: data.media.cover_image_url || undefined,
    };
  });
}

type Props = {
  view: RailView;
  nodes: Node<ArchiveNodeData>[];
  onOpenNode: (nodeId: string) => void;
};

export default function RailPanels({ view, nodes, onOpenNode }: Props) {
  const catalog = useMemo(() => catalogFromNodes(nodes), [nodes]);
  const [query, setQuery] = useState("");

  if (view === "graph") return null;

  const libraryItems = catalog.filter(
    (item) => item.kind === "book" || item.kind === "movie",
  );
  const archiveItems = [...catalog].sort((a, b) =>
    a.title.localeCompare(b.title),
  );
  const searchItems = catalog.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.kind.includes(q)
    );
  });

  const title =
    view === "library" ? "Library" : view === "search" ? "Search" : "Archive";
  const items =
    view === "library"
      ? libraryItems
      : view === "search"
        ? searchItems
        : archiveItems;

  return (
    <div className="absolute inset-0 z-10 overflow-auto bg-canvas pl-24 pr-8 pt-24 pb-8">
      <div className="mx-auto max-w-3xl">
        <h2 className="font-serif text-4xl font-medium text-ink">{title}</h2>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-muted">
          {view === "library" && "Books and films in your collection"}
          {view === "search" && "Find anything on the canvas"}
          {view === "archive" && "Full catalog of saved entries"}
        </p>

        {view === "search" && (
          <input
            autoFocus
            className="mt-6 w-full border-b border-outline bg-transparent py-3 font-serif text-xl outline-none"
            placeholder="Search notes, books, films…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        )}

        {view === "library" && (
          <div className="mt-6 flex gap-2">
            <span className="pill">
              {libraryItems.filter((i) => i.kind === "book").length} books
            </span>
            <span className="pill">
              {libraryItems.filter((i) => i.kind === "movie").length} films
            </span>
          </div>
        )}

        <ul className="mt-8 space-y-2">
          {items.length === 0 && (
            <li className="rounded-lg border border-dashed border-outline bg-card/60 px-4 py-8 text-center font-mono text-xs text-muted">
              {view === "library"
                ? "No books or films yet — use + Add Book or + Log Film."
                : view === "search"
                  ? query.trim()
                    ? "No matches"
                    : "Start typing to search your archive"
                  : "Archive is empty — add entries from the top bar."}
            </li>
          )}
          {items.map((item) => (
            <li key={item.nodeId}>
              <button
                type="button"
                className="flex w-full items-center gap-4 rounded-lg border border-outline/50 bg-card p-3 text-left shadow-card transition hover:border-ink hover:shadow-card-hover"
                onClick={() => onOpenNode(item.nodeId)}
              >
                <div className="h-14 w-11 shrink-0 overflow-hidden rounded bg-surface-low">
                  {item.thumb ? (
                    <img
                      src={item.thumb}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-mono text-[9px] uppercase text-muted">
                      {item.kind.slice(0, 4)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-serif text-lg text-ink">
                    {item.title}
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[11px] text-muted">
                    {item.kind}
                    {item.subtitle ? ` · ${item.subtitle}` : ""}
                    {item.status ? ` · ${item.status}` : ""}
                  </div>
                </div>
                <span className="material-symbols-outlined text-muted">
                  north_east
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
