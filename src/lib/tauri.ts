import { invoke } from "@tauri-apps/api/core";
import type { MediaMetadata, ParsedNote } from "../types";

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function fetchUrlMetadata(url: string): Promise<MediaMetadata> {
  if (!isTauri()) {
    return browserFallbackMetadata(url);
  }
  return invoke<MediaMetadata>("fetch_url_metadata", { url });
}

export async function parseAppleNotesExport(
  filePaths: string[],
): Promise<ParsedNote[]> {
  if (!isTauri()) {
    throw new Error("Apple Notes import requires the desktop app.");
  }
  return invoke<ParsedNote[]>("parse_apple_notes_export", { filePaths });
}

function browserFallbackMetadata(url: string): MediaMetadata {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    let media_type = "article";
    let image_url = "";
    let site_name = host;
    let title = url;

    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      media_type = "youtube";
      site_name = "YouTube";
      const id =
        host.includes("youtu.be")
          ? parsed.pathname.replace("/", "")
          : parsed.searchParams.get("v") ?? "";
      if (id) {
        image_url = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
        title = `YouTube ${id}`;
      }
    } else if (host.includes("substack.com")) {
      media_type = "substack";
    } else if (host.includes("instagram.com")) {
      media_type = "instagram";
    }

    return {
      url,
      title,
      description: "",
      image_url,
      site_name,
      media_type,
    };
  } catch {
    throw new Error("Invalid URL");
  }
}
