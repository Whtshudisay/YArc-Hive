import { createContext, useContext } from "react";
import type { Book, MediaItem, Note } from "../types";

export type ArchiveActions = {
  updateNote: (note: Note) => void;
  updateBook: (
    id: string,
    patch: Partial<Pick<Book, "status" | "rating" | "notes_markdown" | "title" | "author">>,
  ) => void;
  updateMedia: (
    id: string,
    patch: Partial<
      Pick<
        MediaItem,
        "notes_markdown" | "title" | "creator_or_author" | "genre" | "metadata_json"
      >
    >,
  ) => void;
  deleteNode: (id: string) => void;
};

const ArchiveContext = createContext<ArchiveActions | null>(null);

export const ArchiveProvider = ArchiveContext.Provider;

export function useArchiveActions(): ArchiveActions {
  const ctx = useContext(ArchiveContext);
  if (!ctx) {
    throw new Error("Archive actions unavailable");
  }
  return ctx;
}
