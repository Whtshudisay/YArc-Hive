export type Note = {
  id: string;
  title: string;
  content: string;
  source: string;
  created_at: string;
  updated_at: string;
};

export type BookStatus = "wishlist" | "reading" | "read";

export type Book = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  cover_url: string;
  status: BookStatus;
  rating: number;
  notes_markdown: string;
};

export type MediaType =
  | "youtube"
  | "movie"
  | "substack"
  | "instagram"
  | "article"
  | "generic";

export type MediaItem = {
  id: string;
  media_type: MediaType;
  url: string;
  title: string;
  creator_or_author: string;
  cover_image_url: string;
  genre: string;
  metadata_json: string;
  notes_markdown: string;
};

export type ItemType = "note" | "book" | "media";

export type CanvasNodeRow = {
  id: string;
  item_type: ItemType;
  item_id: string;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  cluster_group: string | null;
};

export type CanvasEdgeRow = {
  id: string;
  source_node_id: string;
  target_node_id: string;
  label: string | null;
};

export type NoteNodeData = {
  itemType: "note";
  note: Note;
};

export type BookNodeData = {
  itemType: "book";
  book: Book;
};

export type MediaNodeData = {
  itemType: "media";
  media: MediaItem;
};

export type ArchiveNodeData = NoteNodeData | BookNodeData | MediaNodeData;

export type FilterId =
  | "all"
  | "notes"
  | "books"
  | "videos"
  | "cinema"
  | "articles"
  | "wishlist";

export type MediaMetadata = {
  url: string;
  title: string;
  description: string;
  image_url: string;
  site_name: string;
  media_type: string;
};

export type ParsedNote = {
  title: string;
  content: string;
  tags: string[];
  source_path: string;
};

export type OpenLibraryDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  isbn?: string[];
  cover_i?: number;
  first_publish_year?: number;
};
