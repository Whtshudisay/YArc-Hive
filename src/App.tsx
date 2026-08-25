import {
  addEdge,
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import { open } from "@tauri-apps/plugin-dialog";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import AddMovieModal from "./components/AddMovieModal";
import AddToArchiveModal from "./components/AddToArchiveModal";
import DropUrlModal from "./components/DropUrlModal";
import HeaderBar from "./components/HeaderBar";
import OpenLibraryModal from "./components/OpenLibraryModal";
import RailPanels from "./components/RailPanels";
import Sidebar from "./components/Sidebar";
import BookNode from "./components/nodes/BookNode";
import MediaNode from "./components/nodes/MediaNode";
import MovieNode from "./components/nodes/MovieNode";
import NoteNode from "./components/nodes/NoteNode";
import { ArchiveProvider, type ArchiveActions } from "./lib/archive-context";
import {
  createBookNode,
  createMediaNode,
  createMovieNode,
  createNoteNode,
  deleteEdge,
  deleteNode as deleteNodeRow,
  initDb,
  loadCanvas,
  normalizeMediaType,
  saveEdge,
  saveNodePosition,
  updateBook,
  updateMedia,
  updateNote,
} from "./lib/db";
import { parseMovieMeta } from "./lib/movie-meta";
import { useTheme } from "./lib/theme";
import { fetchUrlMetadata, isTauri, parseAppleNotesExport } from "./lib/tauri";
import type {
  ArchiveNodeData,
  Book,
  FilterId,
  MediaItem,
  Note,
  OpenLibraryDoc,
  RailView,
} from "./types";
import "@xyflow/react/dist/style.css";

function canvasEdgeStyle(): CSSProperties {
  const stroke =
    typeof document !== "undefined"
      ? getComputedStyle(document.documentElement)
          .getPropertyValue("--edge-stroke")
          .trim() || "#404040"
      : "#404040";
  return {
    stroke,
    strokeWidth: 1.75,
    strokeDasharray: "5 4",
  };
}

function canvasDotColor(): string {
  if (typeof document === "undefined") return "#c9c8c3";
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--dot-color")
      .trim() || "#c9c8c3"
  );
}

const nodeTypes = {
  note: NoteNode,
  book: BookNode,
  media: MediaNode,
  movieNode: MovieNode,
};

const URL_RE = /https?:\/\/[^\s]+/i;

function matchesFilter(node: Node<ArchiveNodeData>, filter: FilterId): boolean {
  if (filter === "all") return true;
  const data = node.data;
  if (filter === "notes") return data.itemType === "note";
  if (filter === "books") return data.itemType === "book";
  if (filter === "wishlist") {
    if (data.itemType === "book") return data.book.status === "wishlist";
    if (data.itemType === "movie") {
      return (parseMovieMeta(data.media.metadata_json).status ?? "watchlist") === "watchlist";
    }
    return false;
  }
  if (data.itemType === "movie") return filter === "cinema";
  if (data.itemType !== "media") return false;
  if (filter === "videos") return data.media.media_type === "youtube";
  if (filter === "cinema") return data.media.media_type === "movie";
  return ["article", "substack", "generic"].includes(data.media.media_type);
}

function CanvasApp({
  view,
  onViewChange,
  theme,
  onToggleTheme,
}: {
  view: RailView;
  onViewChange: (view: RailView) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}) {
  const { screenToFlowPosition, setCenter, getNode } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ArchiveNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [filter, setFilter] = useState<FilterId>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const [filmOpen, setFilmOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const pointer = useRef({ x: 480, y: 240 });
  const noteTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const flowPos = useCallback(
    (offset = 0) =>
      screenToFlowPosition({
        x: pointer.current.x + offset,
        y: pointer.current.y + offset,
      }),
    [screenToFlowPosition],
  );

  useEffect(() => {
    void (async () => {
      try {
        await initDb();
        const canvas = await loadCanvas();
        setNodes(canvas.nodes);
        setEdges(canvas.edges);
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "Failed to load archive");
      }
    })();
  }, [setEdges, setNodes]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const actions: ArchiveActions = useMemo(
    () => ({
      updateNote: (note: Note) => {
        setNodes((curr) =>
          curr.map((n) =>
            n.data.itemType === "note" && n.data.note.id === note.id
              ? { ...n, data: { itemType: "note", note } }
              : n,
          ),
        );
        const prev = noteTimers.current.get(note.id);
        if (prev) clearTimeout(prev);
        noteTimers.current.set(
          note.id,
          setTimeout(() => {
            void updateNote(note);
          }, 350),
        );
      },
      updateBook: (id, patch) => {
        setNodes((curr) =>
          curr.map((n) => {
            if (n.data.itemType !== "book" || n.data.book.id !== id) return n;
            const book: Book = { ...n.data.book, ...patch };
            return { ...n, data: { itemType: "book", book } };
          }),
        );
        void updateBook(id, patch);
      },
      updateMedia: (id, patch) => {
        setNodes((curr) =>
          curr.map((n) => {
            if (
              (n.data.itemType !== "media" && n.data.itemType !== "movie") ||
              n.data.media.id !== id
            ) {
              return n;
            }
            const media: MediaItem = { ...n.data.media, ...patch };
            if (n.data.itemType === "movie") {
              return { ...n, data: { itemType: "movie", media } };
            }
            return { ...n, data: { itemType: "media", media } };
          }),
        );
        void updateMedia(id, patch);
      },
      deleteNode: (id) => {
        setNodes((curr) => curr.filter((n) => n.id !== id));
        setEdges((curr) => curr.filter((e) => e.source !== id && e.target !== id));
        void deleteNodeRow(id);
      },
    }),
    [setEdges, setNodes],
  );

  const visibleNodes = useMemo(
    () => nodes.map((n) => ({ ...n, hidden: !matchesFilter(n, filter) })),
    [filter, nodes],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge({ ...connection, style: canvasEdgeStyle() }, eds),
      );
      if (connection.source && connection.target) {
        void saveEdge(connection.source, connection.target);
      }
    },
    [setEdges],
  );

  const openNodeOnGraph = useCallback(
    (nodeId: string) => {
      onViewChange("graph");
      requestAnimationFrame(() => {
        const node = getNode(nodeId);
        if (!node) return;
        const w = typeof node.measured?.width === "number" ? node.measured.width : 260;
        const h = typeof node.measured?.height === "number" ? node.measured.height : 320;
        setCenter(node.position.x + w / 2, node.position.y + h / 2, {
          zoom: 1.05,
          duration: 400,
        });
        setNodes((curr) =>
          curr.map((n) => ({ ...n, selected: n.id === nodeId })),
        );
      });
    },
    [getNode, onViewChange, setCenter, setNodes],
  );

  const addMediaFromUrl = useCallback(
    async (url: string, pos?: { x: number; y: number }) => {
      setStatus("Fetching metadata…");
      try {
        const meta = await fetchUrlMetadata(url);
        const mediaType = normalizeMediaType(meta.media_type);
        const node = await createMediaNode(
          {
            media_type: mediaType,
            url: meta.url,
            title: meta.title,
            creator_or_author: meta.site_name,
            cover_image_url: meta.image_url,
            genre: "",
            metadata_json: JSON.stringify({
              description: meta.description,
              site_name: meta.site_name,
            }),
            notes_markdown: meta.description,
          },
          pos ?? flowPos(),
        );
        setNodes((curr) => [...curr, node]);
        setStatus(null);
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "Could not fetch URL");
      }
    },
    [flowPos, setNodes],
  );

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      const text = e.clipboardData?.getData("text")?.trim() ?? "";
      if (!URL_RE.test(text)) return;
      e.preventDefault();
      void addMediaFromUrl(text.match(URL_RE)?.[0] ?? text);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addMediaFromUrl]);

  const importAppleNotes = async () => {
    if (!isTauri()) {
      setStatus("Apple Notes import is available in the desktop app.");
      return;
    }
    try {
      const selected = await open({
        multiple: true,
        title: "Import Apple Notes export",
        filters: [{ name: "Notes", extensions: ["txt", "md", "html", "htm"] }],
      });
      const paths = Array.isArray(selected) ? selected : selected ? [selected] : [];
      if (paths.length === 0) return;
      const parsed = await parseAppleNotesExport(paths);
      const origin = flowPos();
      const created = await Promise.all(
        parsed.map((note, i) =>
          createNoteNode(
            {
              title: note.title,
              content: note.content,
              source: note.source_path,
            },
            { x: origin.x + (i % 4) * 40, y: origin.y + i * 40 },
          ),
        ),
      );
      setNodes((curr) => [...curr, ...created]);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Import failed");
    }
  };

  return (
    <ArchiveProvider value={actions}>
      <div
        className="relative h-full w-full"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const uri =
            e.dataTransfer.getData("text/uri-list") ||
            e.dataTransfer.getData("text/plain");
          const match = uri.trim().match(URL_RE);
          if (!match) return;
          const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
          void addMediaFromUrl(match[0], pos);
        }}
      >
        <HeaderBar
          view={view}
          filter={filter}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onFilter={setFilter}
          onAddNote={() => setAddOpen(true)}
          onAddBook={() => setBookOpen(true)}
          onDropUrl={() => setUrlOpen(true)}
          onLogFilm={() => setFilmOpen(true)}
          onImportNotes={() => void importAppleNotes()}
        />
        {status && (
          <div className="absolute right-6 top-6 z-30 max-w-sm rounded-full border border-ink bg-card px-3 py-1 font-mono text-[11px] text-ink">
            {status}
          </div>
        )}
        <div className={view === "graph" ? "h-full w-full" : "pointer-events-none invisible absolute inset-0 h-full w-full"}>
          <ReactFlow
            nodes={visibleNodes}
            edges={edges.map((e) => ({
              ...e,
              style: { ...canvasEdgeStyle(), ...(e.style ?? {}) },
            }))}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeDragStop={(_, node) => {
              saveNodePosition(node.id, node.position.x, node.position.y);
            }}
            onEdgesDelete={(deleted) => {
              deleted.forEach((edge) => void deleteEdge(edge.id));
            }}
            fitView
            minZoom={0.2}
            defaultEdgeOptions={{
              style: canvasEdgeStyle(),
            }}
            colorMode={theme}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={22}
              size={1.4}
              color={canvasDotColor()}
            />
            <MiniMap
              pannable
              zoomable
              className="!bg-card/80"
              maskColor={
                theme === "dark"
                  ? "rgba(26,27,27,0.75)"
                  : "rgba(232,231,227,0.7)"
              }
            />
          </ReactFlow>
        </div>
        <RailPanels view={view} nodes={nodes} onOpenNode={openNodeOnGraph} />
        <AddToArchiveModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onCreateNote={(title, content) => {
            void createNoteNode({ title, content, source: "manual" }, flowPos()).then(
              (node) => setNodes((curr) => [...curr, node]),
            );
            setAddOpen(false);
          }}
          onCreateBook={(input) => {
            void createBookNode(
              { ...input, rating: 0, notes_markdown: "" },
              flowPos(),
            ).then((node) => setNodes((curr) => [...curr, node]));
            setAddOpen(false);
          }}
          onCreateMedia={(input) => {
            if (
              input.url &&
              (input.media_type === "youtube" || input.media_type === "article")
            ) {
              void addMediaFromUrl(input.url);
            } else if (input.media_type === "movie") {
              let year = "";
              try {
                year = String(
                  (JSON.parse(input.metadata_json || "{}") as { year?: string })
                    .year ?? "",
                );
              } catch {
                year = "";
              }
              void createMovieNode(
                {
                  title: input.title,
                  poster_url: input.cover_image_url,
                  release_year: year,
                  overview: "",
                  director: input.creator_or_author,
                  status: "watchlist",
                  rating: 0,
                  notes_markdown: input.notes_markdown,
                  url: input.url,
                },
                flowPos(),
              ).then((node) => setNodes((curr) => [...curr, node]));
            } else {
              void createMediaNode(input, flowPos()).then((node) =>
                setNodes((curr) => [...curr, node]),
              );
            }
            setAddOpen(false);
          }}
        />
        <AddMovieModal
          open={filmOpen}
          onClose={() => setFilmOpen(false)}
          onLog={(movie) => {
            void createMovieNode(
              {
                title: movie.title,
                poster_url: movie.poster_url,
                release_year: movie.release_year,
                overview: movie.overview,
                tmdb_id: movie.tmdb_id,
                vote_average: movie.vote_average,
                genre_ids: movie.genre_ids,
                status: movie.status,
                rating: movie.rating,
                notes_markdown: movie.notes_markdown,
              },
              flowPos(),
            ).then((node) => setNodes((curr) => [...curr, node]));
            setFilmOpen(false);
          }}
        />
        <OpenLibraryModal
          open={bookOpen}
          onClose={() => setBookOpen(false)}
          onSelect={(doc: OpenLibraryDoc) => {
            void createBookNode(
              {
                title: doc.title ?? "Untitled",
                author: (doc.author_name ?? []).join(", "),
                isbn: doc.isbn?.[0] ?? "",
                cover_url: doc.cover_i
                  ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
                  : "",
                status: "wishlist",
                rating: 0,
                notes_markdown: "",
              },
              flowPos(),
            ).then((node) => setNodes((curr) => [...curr, node]));
            setBookOpen(false);
          }}
        />
        <DropUrlModal
          open={urlOpen}
          onClose={() => setUrlOpen(false)}
          onSubmit={(url) => {
            void addMediaFromUrl(url);
            setUrlOpen(false);
          }}
        />
      </div>
    </ArchiveProvider>
  );
}

export default function App() {
  const [view, setView] = useState<RailView>("graph");
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="relative h-screen overflow-hidden bg-canvas text-ink">
      <Sidebar view={view} onViewChange={setView} />
      <div className="absolute inset-0">
        <ReactFlowProvider>
          <CanvasApp
            view={view}
            onViewChange={setView}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
