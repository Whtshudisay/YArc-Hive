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

const KINDS: { id: EntryKind; title: string; hint: string }[] = [
  { id: "note", title: "Note", hint: "Blank canvas" },
  { id: "book", title: "Book", hint: "By ISBN/Title" },
  { id: "video", title: "Video", hint: "Import via URL" },
  { id: "cinema", title: "Cinema", hint: "Movie or Show" },
  { id: "article", title: "Article", hint: "Web clip" },
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
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/20 p-6">
      <div className="flex max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-card">
        <div className="w-56 border-r border-neutral-100 p-4">
          <h2 className="font-serif text-3xl">Add to Archive</h2>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-neutral-500">
            Select a media type to create a new entry.
          </p>
          <div className="mt-4 space-y-2">
            {KINDS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setKind(item.id)}
                className={`w-full rounded-md border px-3 py-2 text-left ${
                  kind === item.id
                    ? "border-neutral-800 bg-white shadow-sm"
                    : "border-transparent hover:bg-neutral-50"
                }`}
              >
                <div className="font-serif text-base">{item.title}</div>
                <div className="font-mono text-[10px] text-neutral-500">
                  {item.hint}
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-1 flex-col p-6">
          {kind === "note" && (
            <>
              <input
                className="font-serif text-2xl outline-none"
                placeholder="Untitled Note"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="mt-4 flex-1 resize-none font-mono text-sm text-neutral-600 outline-none"
                placeholder="Start typing..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </>
          )}
          {kind === "book" && (
            <div className="space-y-3">
              <Field label="Title" value={title} onChange={setTitle} />
              <Field label="Author" value={author} onChange={setAuthor} />
              <Field label="ISBN" value={isbn} onChange={setIsbn} />
              <Field label="Cover URL" value={cover} onChange={setCover} />
            </div>
          )}
          {(kind === "video" || kind === "article") && (
            <div className="space-y-3">
              <Field label="URL" value={url} onChange={setUrl} />
              <Field label="Title (optional)" value={title} onChange={setTitle} />
              <Field label="Creator / publication" value={author} onChange={setAuthor} />
            </div>
          )}
          {kind === "cinema" && (
            <div className="space-y-3">
              <Field label="Title" value={title} onChange={setTitle} />
              <Field label="Director" value={author} onChange={setAuthor} />
              <Field label="Year" value={year} onChange={setYear} />
              <Field label="Genre" value={genre} onChange={setGenre} />
              <Field label="Poster URL" value={cover} onChange={setCover} />
            </div>
          )}
          <div className="mt-auto flex justify-end gap-2 pt-6">
            <button type="button" className="pill-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="rounded-full bg-neutral-800 px-4 py-1.5 font-mono text-xs text-white"
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
        className="mt-1 w-full border-b border-neutral-200 bg-transparent py-1 font-serif text-lg outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
