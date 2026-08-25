import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { useState } from "react";
import { cycleBookStatus } from "../../lib/db";
import { useArchiveActions } from "../../lib/archive-context";
import type { BookNodeData } from "../../types";

export default function BookNode({ id, data }: NodeProps<Node<BookNodeData>>) {
  const actions = useArchiveActions();
  const [open, setOpen] = useState(false);
  const { book } = data;

  return (
    <article className="archive-card flex w-[320px] gap-3 p-3">
      <Handle type="target" position={Position.Top} className="archive-handle" />
      <div className="h-40 w-[92px] shrink-0 overflow-hidden rounded-sm bg-neutral-200">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-[10px] text-neutral-500">
            NO COVER
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-serif text-lg leading-tight text-neutral-900">
          {book.title}
        </h3>
        <p className="mt-1 font-mono text-[11px] text-neutral-500">
          {book.author || "Unknown author"}
        </p>
        <button
          type="button"
          className="pill mt-2"
          onClick={() =>
            actions.updateBook(book.id, { status: cycleBookStatus(book.status) })
          }
        >
          {book.status.toUpperCase()}
        </button>
        <div className="mt-2 flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`text-sm ${star <= book.rating ? "text-neutral-900" : "text-neutral-300"}`}
              onClick={() => actions.updateBook(book.id, { rating: star })}
              aria-label={`${star} stars`}
            >
              ★
            </button>
          ))}
        </div>
        <button
          type="button"
          className="mt-2 font-mono text-[10px] uppercase tracking-wide text-neutral-500"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide takeaways" : "Takeaways"}
        </button>
        {open && (
          <textarea
            className="nodrag nowheel mt-1 h-16 w-full resize-none rounded border border-neutral-200 bg-neutral-50 p-1.5 font-serif text-xs outline-none"
            value={book.notes_markdown}
            placeholder="Key takeaways..."
            onChange={(e) =>
              actions.updateBook(book.id, { notes_markdown: e.target.value })
            }
          />
        )}
        <button
          type="button"
          className="mt-2 block font-mono text-[10px] uppercase tracking-wide text-neutral-400 hover:text-neutral-800"
          onClick={() => actions.deleteNode(id)}
        >
          Remove
        </button>
      </div>
      <Handle type="source" position={Position.Bottom} className="archive-handle" />
    </article>
  );
}
