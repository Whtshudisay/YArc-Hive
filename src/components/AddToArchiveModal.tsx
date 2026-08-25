import { useEffect, useState } from "react";
import type { BookStatus, MediaType } from "../types";

export type EntryKind = "note" | "book" | "video" | "cinema" | "article";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreateNote: (title: string, content: string) => void;
  onCreateBook: (input: {
    title: string;
    author: string;
    isbn: string;
    cover_url: string;
    status: BookStatus;
  }) => void;
  onCreateMedia: (input: {
    media_type: MediaType;
    url: string;
    title: string;
    creator_or_author: string;
    cover_image_url: string;
    genre: string;
    notes_markdown: string;
    metadata_json: string;
  }) => void;
};

const KINDS: { id: EntryKind; title: string; hint: string; icon: string }[] = [
  { id: "note", title: "Note", hint: "Blank canvas", icon: "edit_note" },
  { id: "book", title: "Book", hint: "By ISBN/Title", icon: "menu_book" },
  { id: "video", title: "Video", hint: "Import via URL", icon: "videocam" },
  { id: "cinema", title: "Cinema", hint: "Movie or Show", icon: "movie" },
  { id: "article", title: "Article", hint: "Web clip", icon: "article" },
];

export default function AddToArchiveModal({
  open,
  onClose,
  onCreateNote,
  onCreateBook,
  onCreateMedia,
}: Props) {
  const [kind, setKind] = useState<EntryKind>("note");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [url, setUrl] = useState("");
  const [cover, setCover] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");

  useEffect(() => {
    if (open) {
      setKind("note");
      setTitle("");
      setBody("");
      setAuthor("");
      setIsbn("");
      setUrl("");
      setCover("");
      setGenre("");
      setYear("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/15 p-6 backdrop-blur-[2px]">
      <div className="flex max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-xl border border-outline/40 bg-white shadow-card-hover">
        <div className="w-[240px] shrink-0 border-r border-outline/30 bg-surface-low p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-outline bg-white font-serif text-sm">
              ◈
            </div>
            <div>
              <div className="font-serif text-xl leading-none text-ink">Workspace</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                Personal Archive
              </div>
            </div>
          </div>
          <h2 className="font-serif text-[32px] font-medium leading-tight text-ink">
            Add to Archive
          </h2>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-neutral-500">
            Select a media type to create a new entry.
          </p>
          <div className="mt-6 space-y-2">
            {KINDS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setKind(item.id)}
                className={`flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${
                  kind === item.id
                    ? "border-ink bg-white shadow-card"
                    : "border-transparent hover:bg-white/70"
                }`}
              >
                <span className="material-symbols-outlined mt-0.5 text-neutral-600">
                  {item.icon}
                </span>
                <span>
                  <div className="font-serif text-base text-ink">{item.title}</div>
                  <div className="font-mono text-[10px] text-neutral-500">{item.hint}</div>
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex min-h-[420px] flex-1 flex-col p-8">
          {kind === "note" && (
            <>
              <input
                className="w-full bg-transparent font-serif text-[32px] font-medium text-ink outline-none placeholder:text-neutral-300"
                placeholder="Untitled Note"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="mt-4 flex-1 resize-none bg-transparent font-serif text-lg italic leading-relaxed text-neutral-600 outline-none placeholder:not-italic placeholder:text-neutral-300"
                placeholder="Start typing..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </>
          )}
          {kind === "book" && (
            <div className="space-y-4">
              <Field label="Title" value={title} onChange={setTitle} />
              <Field label="Author" value={author} onChange={setAuthor} />
              <Field label="ISBN" value={isbn} onChange={setIsbn} />
              <Field label="Cover URL" value={cover} onChange={setCover} />
            </div>
          )}
          {(kind === "video" || kind === "article") && (
            <div className="space-y-4">
              <Field label="URL" value={url} onChange={setUrl} />
              <Field label="Title (optional)" value={title} onChange={setTitle} />
              <Field label="Creator / publication" value={author} onChange={setAuthor} />
            </div>
          )}
          {kind === "cinema" && (
            <div className="space-y-4">
              <Field label="Title" value={title} onChange={setTitle} />
              <Field label="Director" value={author} onChange={setAuthor} />
              <Field label="Year" value={year} onChange={setYear} />
              <Field label="Genre" value={genre} onChange={setGenre} />
              <Field label="Poster URL" value={cover} onChange={setCover} />
            </div>
          )}
          <div className="mt-auto flex justify-end gap-2 pt-8">
            <button type="button" className="pill-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="pill-btn-primary"
              onClick={() => {
                if (kind === "note") {
                  onCreateNote(title || "Untitled Note", body);
                } else if (kind === "book") {
                  onCreateBook({
                    title: title || "Untitled Book",
                    author,
                    isbn,
                    cover_url: cover,
                    status: "wishlist",
                  });
                } else if (kind === "cinema") {
                  onCreateMedia({
                    media_type: "movie",
                    url: "",
                    title: title || "Untitled film",
                    creator_or_author: author,
                    cover_image_url: cover,
                    genre,
                    notes_markdown: "",
                    metadata_json: JSON.stringify({ year }),
                  });
                } else {
                  onCreateMedia({
                    media_type: kind === "video" ? "youtube" : "article",
                    url,
                    title: title || url || "Untitled",
                    creator_or_author: author,
                    cover_image_url: "",
                    genre: "",
                    notes_markdown: "",
                    metadata_json: "{}",
                  });
                }
              }}
            >
              Create {kind === "note" ? "Note" : "Entry"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      <input
        className="mt-1 w-full border-b border-outline bg-transparent py-2 font-serif text-xl text-ink outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
