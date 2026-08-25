type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
};

export default function DropUrlModal({ open, onClose, onSubmit }: Props) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/20 p-6">
      <form
        className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-card"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const url = String(data.get("url") ?? "").trim();
          if (url) onSubmit(url);
        }}
      >
        <h2 className="font-serif text-3xl">Drop URL</h2>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-neutral-500">
          YouTube, Substack, Instagram, or any article
        </p>
        <input
          name="url"
          autoFocus
          className="mt-6 w-full border-b border-neutral-300 bg-transparent py-1 font-mono text-sm outline-none"
          placeholder="https://"
        />
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="pill-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-full bg-neutral-800 px-4 py-1.5 font-mono text-xs text-white"
          >
            Add media
          </button>
        </div>
      </form>
    </div>
  );
}
