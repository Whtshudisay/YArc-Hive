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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AddToArchiveModal from "./components/AddToArchiveModal";
import DropUrlModal from "./components/DropUrlModal";
import HeaderBar from "./components/HeaderBar";
import OpenLibraryModal from "./components/OpenLibraryModal";
import Sidebar from "./components/Sidebar";
import BookNode from "./components/nodes/BookNode";
import MediaNode from "./components/nodes/MediaNode";
import NoteNode from "./components/nodes/NoteNode";
import { ArchiveProvider, type ArchiveActions } from "./lib/archive-context";
import {
  createBookNode,
  createMediaNode,
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
import { fetchUrlMetadata, isTauri, parseAppleNotesExport } from "./lib/tauri";
import type {
  ArchiveNodeData,
  Book,
  FilterId,
  MediaItem,
  Note,
  OpenLibraryDoc,
} from "./types";
import "@xyflow/react/dist/style.css";

const nodeTypes = {
  note: NoteNode,
  book: BookNode,
  media: MediaNode,
};

const URL_RE = /https?:\/\/[^\s]+/i;

function matchesFilter(node: Node<ArchiveNodeData>, filter: FilterId): boolean {
  if (filter === "all") return true;
  const data = node.data;
  if (filter === "notes") return data.itemType === "note";
  if (filter === "books") return data.itemType === "book";
  if (filter === "wishlist") {
    return data.itemType === "book" && data.book.status === "wishlist";
  }
  if (data.itemType !== "media") return false;
  if (filter === "videos") return data.media.media_type === "youtube";
  if (filter === "cinema") return data.media.media_type === "movie";
  return ["article", "substack", "generic"].includes(data.media.media_type);
}

function CanvasApp({
  addOpen,
  setAddOpen,
}: {
  addOpen: boolean;
  setAddOpen: (open: boolean) => void;
}) {
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ArchiveNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [filter, setFilter] = useState<FilterId>("all");
  const [bookOpen, setBookOpen] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
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
            if (n.data.itemType !== "media" || n.data.media.id !== id) return n;
            const media: MediaItem = { ...n.data.media, ...patch };
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
        addEdge({ ...connection, style: { strokeDasharray: "4 4" } }, eds),
      );
      if (connection.source && connection.target) {
        void saveEdge(connection.source, connection.target);
      }
    },
    [setEdges],
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
          filter={filter}
          onFilter={setFilter}
          onAddNote={() => setAddOpen(true)}
          onAddBook={() => setBookOpen(true)}
          onDropUrl={() => setUrlOpen(true)}
          onImportNotes={() => void importAppleNotes()}
        />
        {status && (
          <div className="absolute right-6 top-6 z-30 max-w-sm rounded-full border border-neutral-800 bg-white px-3 py-1 font-mono text-[11px]">
            {status}
          </div>
        )}
        <ReactFlow
          nodes={visibleNodes}
          edges={edges}
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
            style: { stroke: "#a3a3a3", strokeDasharray: "4 4" },
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={22}
            size={1.4}
            color="#c9c8c3"
          />
          <MiniMap
            pannable
            zoomable
            className="!bg-white/80"
            maskColor="rgba(232,231,227,0.7)"
          />
        </ReactFlow>
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
            } else {
              void createMediaNode(input, flowPos()).then((node) =>
                setNodes((curr) => [...curr, node]),
              );
            }
            setAddOpen(false);
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
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar onNewEntry={() => setAddOpen(true)} />
      <div className="relative min-w-0 flex-1">
        <ReactFlowProvider>
          <CanvasApp addOpen={addOpen} setAddOpen={setAddOpen} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
