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
    <article className="archive-card w-[280px] p-4">
      <Handle type="target" position={Position.Top} className="archive-handle" />
      <input
        className="nodrag nowheel w-full bg-transparent font-serif text-xl text-neutral-900 outline-none"
        value={data.note.title}
        onChange={(e) =>
          actions.updateNote({ ...data.note, title: e.target.value })
        }
      />
      <textarea
        className="nodrag nowheel mt-3 h-28 w-full resize-none bg-transparent font-serif text-sm italic leading-relaxed text-neutral-700 outline-none"
        value={data.note.content}
        placeholder="Start typing..."
        onChange={(e) =>
          actions.updateNote({ ...data.note, content: e.target.value })
        }
      />
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="pill">
              #{tag}
            </span>
          ))}
        </div>
      )}
      <button
        type="button"
        className="mt-3 font-mono text-[10px] uppercase tracking-wide text-neutral-400 hover:text-neutral-800"
        onClick={() => actions.deleteNode(id)}
      >
        Remove
      </button>
      <Handle type="source" position={Position.Bottom} className="archive-handle" />
    </article>
  );
}
