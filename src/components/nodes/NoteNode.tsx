import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { useMemo } from "react";
import { useArchiveActions } from "../../lib/archive-context";
import type { NoteNodeData } from "../../types";

function extractTags(content: string): string[] {
  const matches = content.match(/(^|\s)#([A-Za-z0-9/_-]+)/g) ?? [];
  return [...new Set(matches.map((m) => m.trim().replace(/^#/, "")))];
}

export default function NoteNode({ id, data }: NodeProps<Node<NoteNodeData>>) {
  const actions = useArchiveActions();
  const tags = useMemo(() => extractTags(data.note.content), [data.note.content]);

  return (
    <article className="archive-card w-[300px] p-6">
      <Handle type="target" position={Position.Top} className="archive-handle" />
      <input
        className="nodrag nowheel w-full bg-transparent font-serif text-2xl font-medium text-ink outline-none"
        value={data.note.title}
        onChange={(e) =>
          actions.updateNote({ ...data.note, title: e.target.value })
        }
      />
      <textarea
        className="nodrag nowheel mt-3 h-28 w-full resize-none bg-transparent font-serif text-base italic leading-relaxed text-neutral-600 outline-none"
        value={data.note.content}
        placeholder="Start typing..."
        onChange={(e) =>
          actions.updateNote({ ...data.note, content: e.target.value })
        }
      />
      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="pill">
              #{tag}
            </span>
          ))}
        </div>
      )}
      <button
        type="button"
        className="mt-4 font-mono text-[10px] uppercase tracking-wide text-neutral-400 hover:text-ink"
        onClick={() => actions.deleteNode(id)}
      >
        Remove
      </button>
      <Handle type="source" position={Position.Bottom} className="archive-handle" />
    </article>
  );
}
