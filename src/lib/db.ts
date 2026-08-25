import Database from "@tauri-apps/plugin-sql";
import type { Edge, Node } from "@xyflow/react";
import { isTauri } from "./tauri";
import type {
  ArchiveNodeData,
  Book,
  BookStatus,
  CanvasEdgeRow,
  CanvasNodeRow,
  MediaItem,
  MediaType,
  Note,
} from "../types";

let db: Database | null = null;
const memory = {
  notes: [] as Note[],
  books: [] as Book[],
  media: [] as MediaItem[],
  nodes: [] as CanvasNodeRow[],
  edges: [] as CanvasEdgeRow[],
};

const nowIso = () => new Date().toISOString();

async function getDb(): Promise<Database | null> {
  if (!isTauri()) return null;
  if (db) return db;
  db = await Database.load("sqlite:archive.db");
  return db;
}

export async function initDb(): Promise<void> {
  const database = await getDb();
  if (!database) return;

  await database.execute(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  await database.execute(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL DEFAULT '',
      isbn TEXT NOT NULL DEFAULT '',
      cover_url TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'wishlist',
      rating INTEGER NOT NULL DEFAULT 0,
      notes_markdown TEXT NOT NULL DEFAULT ''
    );
  `);
  await database.execute(`
    CREATE TABLE IF NOT EXISTS media_items (
      id TEXT PRIMARY KEY,
      media_type TEXT NOT NULL,
      url TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      creator_or_author TEXT NOT NULL DEFAULT '',
      cover_image_url TEXT NOT NULL DEFAULT '',
      genre TEXT NOT NULL DEFAULT '',
      metadata_json TEXT NOT NULL DEFAULT '{}',
      notes_markdown TEXT NOT NULL DEFAULT ''
    );
  `);
  await database.execute(`
    CREATE TABLE IF NOT EXISTS canvas_nodes (
      id TEXT PRIMARY KEY,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      pos_x REAL NOT NULL,
      pos_y REAL NOT NULL,
      width REAL NOT NULL DEFAULT 280,
      height REAL NOT NULL DEFAULT 200,
      cluster_group TEXT
    );
  `);
  await database.execute(`
    CREATE TABLE IF NOT EXISTS canvas_edges (
      id TEXT PRIMARY KEY,
      source_node_id TEXT NOT NULL,
      target_node_id TEXT NOT NULL,
      label TEXT
    );
  `);
}

function toFlowNodes(
  rows: CanvasNodeRow[],
  notes: Note[],
  books: Book[],
  media: MediaItem[],
): Node<ArchiveNodeData>[] {
  const notesById = Object.fromEntries(notes.map((n) => [n.id, n]));
  const booksById = Object.fromEntries(books.map((b) => [b.id, b]));
  const mediaById = Object.fromEntries(media.map((m) => [m.id, m]));

  const result: Node<ArchiveNodeData>[] = [];
  for (const row of rows) {
    if (row.item_type === "note") {
      const note = notesById[row.item_id];
      if (!note) continue;
      result.push({
        id: row.id,
        type: "note",
        position: { x: row.pos_x, y: row.pos_y },
        data: { itemType: "note", note },
        style: { width: row.width },
      });
    } else if (row.item_type === "book") {
      const book = booksById[row.item_id];
      if (!book) continue;
      result.push({
        id: row.id,
        type: "book",
        position: { x: row.pos_x, y: row.pos_y },
        data: { itemType: "book", book },
        style: { width: row.width },
      });
    } else {
      const item = mediaById[row.item_id];
      if (!item) continue;
      result.push({
        id: row.id,
        type: "media",
        position: { x: row.pos_x, y: row.pos_y },
        data: { itemType: "media", media: item },
        style: { width: row.width },
      });
    }
  }
  return result;
}

export async function loadCanvas(): Promise<{
  nodes: Node<ArchiveNodeData>[];
  edges: Edge[];
}> {
  const database = await getDb();
  if (!database) {
    return {
      nodes: toFlowNodes(memory.nodes, memory.notes, memory.books, memory.media),
      edges: memory.edges.map((e) => ({
        id: e.id,
        source: e.source_node_id,
        target: e.target_node_id,
        label: e.label ?? undefined,
        type: "default",
      })),
    };
  }

  const [notes, books, media, nodeRows, edgeRows] = await Promise.all([
    database.select<Note[]>("SELECT * FROM notes"),
    database.select<Book[]>("SELECT * FROM books"),
    database.select<MediaItem[]>("SELECT * FROM media_items"),
    database.select<CanvasNodeRow[]>("SELECT * FROM canvas_nodes"),
    database.select<CanvasEdgeRow[]>("SELECT * FROM canvas_edges"),
  ]);

  return {
    nodes: toFlowNodes(nodeRows, notes, books, media),
    edges: edgeRows.map((e) => ({
      id: e.id,
      source: e.source_node_id,
      target: e.target_node_id,
      label: e.label ?? undefined,
    })),
  };
}

const positionQueue = new Map<string, { x: number; y: number }>();
let positionTimer: ReturnType<typeof setTimeout> | null = null;

export function saveNodePosition(id: string, x: number, y: number): void {
  positionQueue.set(id, { x, y });
  if (positionTimer) clearTimeout(positionTimer);
  positionTimer = setTimeout(() => {
    void flushPositions();
  }, 300);
}

async function flushPositions(): Promise<void> {
  const entries = [...positionQueue.entries()];
  positionQueue.clear();
  const database = await getDb();
  for (const [id, pos] of entries) {
    if (!database) {
      const row = memory.nodes.find((n) => n.id === id);
      if (row) {
        row.pos_x = pos.x;
        row.pos_y = pos.y;
      }
      continue;
    }
    await database.execute(
      "UPDATE canvas_nodes SET pos_x = $1, pos_y = $2 WHERE id = $3",
      [pos.x, pos.y, id],
    );
  }
}

async function insertNode(
  itemType: CanvasNodeRow["item_type"],
  itemId: string,
  pos: { x: number; y: number },
  width: number,
  height: number,
): Promise<string> {
  const id = crypto.randomUUID();
  const row: CanvasNodeRow = {
    id,
    item_type: itemType,
    item_id: itemId,
    pos_x: pos.x,
    pos_y: pos.y,
    width,
    height,
    cluster_group: null,
  };
  const database = await getDb();
  if (!database) {
    memory.nodes.push(row);
    return id;
  }
  await database.execute(
    `INSERT INTO canvas_nodes (id, item_type, item_id, pos_x, pos_y, width, height, cluster_group)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, itemType, itemId, pos.x, pos.y, width, height, null],
  );
  return id;
}

export async function createNoteNode(
  note: Omit<Note, "id" | "created_at" | "updated_at"> & { id?: string },
  pos: { x: number; y: number },
): Promise<Node<ArchiveNodeData>> {
  const id = note.id ?? crypto.randomUUID();
  const stamp = nowIso();
  const full: Note = {
    id,
    title: note.title,
    content: note.content,
    source: note.source,
    created_at: stamp,
    updated_at: stamp,
  };
  const database = await getDb();
  if (!database) {
    memory.notes.push(full);
  } else {
    await database.execute(
      `INSERT INTO notes (id, title, content, source, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [full.id, full.title, full.content, full.source, full.created_at, full.updated_at],
    );
  }
  const nodeId = await insertNode("note", full.id, pos, 280, 220);
  return {
    id: nodeId,
    type: "note",
    position: pos,
    data: { itemType: "note", note: full },
    style: { width: 280 },
  };
}

export async function createBookNode(
  book: Omit<Book, "id"> & { id?: string },
  pos: { x: number; y: number },
): Promise<Node<ArchiveNodeData>> {
  const full: Book = {
    id: book.id ?? crypto.randomUUID(),
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    cover_url: book.cover_url,
    status: book.status,
    rating: book.rating,
    notes_markdown: book.notes_markdown,
  };
  const database = await getDb();
  if (!database) {
    memory.books.push(full);
  } else {
    await database.execute(
      `INSERT INTO books (id, title, author, isbn, cover_url, status, rating, notes_markdown)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        full.id,
        full.title,
        full.author,
        full.isbn,
        full.cover_url,
        full.status,
        full.rating,
        full.notes_markdown,
      ],
    );
  }
  const nodeId = await insertNode("book", full.id, pos, 320, 220);
  return {
    id: nodeId,
    type: "book",
    position: pos,
    data: { itemType: "book", book: full },
    style: { width: 320 },
  };
}

export async function createMediaNode(
  media: Omit<MediaItem, "id"> & { id?: string },
  pos: { x: number; y: number },
): Promise<Node<ArchiveNodeData>> {
  const full: MediaItem = {
    id: media.id ?? crypto.randomUUID(),
    media_type: media.media_type,
    url: media.url,
    title: media.title,
    creator_or_author: media.creator_or_author,
    cover_image_url: media.cover_image_url,
    genre: media.genre,
    metadata_json: media.metadata_json,
    notes_markdown: media.notes_markdown,
  };
  const database = await getDb();
  if (!database) {
    memory.media.push(full);
  } else {
    await database.execute(
      `INSERT INTO media_items (id, media_type, url, title, creator_or_author, cover_image_url, genre, metadata_json, notes_markdown)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        full.id,
        full.media_type,
        full.url,
        full.title,
        full.creator_or_author,
        full.cover_image_url,
        full.genre,
        full.metadata_json,
        full.notes_markdown,
      ],
    );
  }
  const width = full.media_type === "instagram" || full.media_type === "movie" ? 240 : 300;
  const nodeId = await insertNode("media", full.id, pos, width, 280);
  return {
    id: nodeId,
    type: "media",
    position: pos,
    data: { itemType: "media", media: full },
    style: { width },
  };
}

export async function deleteNode(id: string): Promise<void> {
  const database = await getDb();
  if (!database) {
    const row = memory.nodes.find((n) => n.id === id);
    memory.nodes = memory.nodes.filter((n) => n.id !== id);
    memory.edges = memory.edges.filter(
      (e) => e.source_node_id !== id && e.target_node_id !== id,
    );
    if (row) {
      const stillUsed = memory.nodes.some((n) => n.item_id === row.item_id);
      if (!stillUsed) {
        memory.notes = memory.notes.filter((n) => n.id !== row.item_id);
        memory.books = memory.books.filter((n) => n.id !== row.item_id);
        memory.media = memory.media.filter((n) => n.id !== row.item_id);
      }
    }
    return;
  }

  const rows = await database.select<CanvasNodeRow[]>(
    "SELECT * FROM canvas_nodes WHERE id = $1",
    [id],
  );
  const row = rows[0];
  await database.execute("DELETE FROM canvas_edges WHERE source_node_id = $1 OR target_node_id = $1", [
    id,
  ]);
  await database.execute("DELETE FROM canvas_nodes WHERE id = $1", [id]);
  if (!row) return;
  const remaining = await database.select<{ c: number }[]>(
    "SELECT COUNT(*) as c FROM canvas_nodes WHERE item_id = $1",
    [row.item_id],
  );
  if ((remaining[0]?.c ?? 0) > 0) return;
  if (row.item_type === "note") {
    await database.execute("DELETE FROM notes WHERE id = $1", [row.item_id]);
  } else if (row.item_type === "book") {
    await database.execute("DELETE FROM books WHERE id = $1", [row.item_id]);
  } else {
    await database.execute("DELETE FROM media_items WHERE id = $1", [row.item_id]);
  }
}

export async function saveEdge(
  source: string,
  target: string,
  label?: string,
): Promise<Edge> {
  const id = crypto.randomUUID();
  const database = await getDb();
  if (!database) {
    memory.edges.push({
      id,
      source_node_id: source,
      target_node_id: target,
      label: label ?? null,
    });
  } else {
    await database.execute(
      `INSERT INTO canvas_edges (id, source_node_id, target_node_id, label) VALUES ($1, $2, $3, $4)`,
      [id, source, target, label ?? null],
    );
  }
  return { id, source, target, label };
}

export async function deleteEdge(id: string): Promise<void> {
  const database = await getDb();
  if (!database) {
    memory.edges = memory.edges.filter((e) => e.id !== id);
    return;
  }
  await database.execute("DELETE FROM canvas_edges WHERE id = $1", [id]);
}

export async function updateNote(note: Note): Promise<void> {
  const next = { ...note, updated_at: nowIso() };
  const database = await getDb();
  if (!database) {
    memory.notes = memory.notes.map((n) => (n.id === next.id ? next : n));
    return;
  }
  await database.execute(
    `UPDATE notes SET title = $1, content = $2, source = $3, updated_at = $4 WHERE id = $5`,
    [next.title, next.content, next.source, next.updated_at, next.id],
  );
}

export async function updateBook(
  id: string,
  patch: Partial<Pick<Book, "status" | "rating" | "notes_markdown" | "title" | "author">>,
): Promise<void> {
  const database = await getDb();
  if (!database) {
    memory.books = memory.books.map((b) => (b.id === id ? { ...b, ...patch } : b));
    return;
  }
  const rows = await database.select<Book[]>("SELECT * FROM books WHERE id = $1", [id]);
  const current = rows[0];
  if (!current) return;
  const next = { ...current, ...patch };
  await database.execute(
    `UPDATE books SET title = $1, author = $2, status = $3, rating = $4, notes_markdown = $5 WHERE id = $6`,
    [next.title, next.author, next.status, next.rating, next.notes_markdown, id],
  );
}

export async function updateMedia(
  id: string,
  patch: Partial<Pick<MediaItem, "notes_markdown" | "title" | "creator_or_author" | "genre">>,
): Promise<void> {
  const database = await getDb();
  if (!database) {
    memory.media = memory.media.map((m) => (m.id === id ? { ...m, ...patch } : m));
    return;
  }
  const rows = await database.select<MediaItem[]>(
    "SELECT * FROM media_items WHERE id = $1",
    [id],
  );
  const current = rows[0];
  if (!current) return;
  const next = { ...current, ...patch };
  await database.execute(
    `UPDATE media_items SET title = $1, creator_or_author = $2, genre = $3, notes_markdown = $4 WHERE id = $5`,
    [next.title, next.creator_or_author, next.genre, next.notes_markdown, id],
  );
}

export function normalizeMediaType(raw: string): MediaType {
  if (
    raw === "youtube" ||
    raw === "movie" ||
    raw === "substack" ||
    raw === "instagram" ||
    raw === "article"
  ) {
    return raw;
  }
  return "article";
}

export function cycleBookStatus(status: BookStatus): BookStatus {
  if (status === "wishlist") return "reading";
  if (status === "reading") return "read";
  return "wishlist";
}
