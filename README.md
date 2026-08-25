# Personal Archive

Local-first visual knowledge and media desktop app for Windows and Linux.

Built with **Tauri v2**, **React**, **TypeScript**, **Tailwind CSS**, **@xyflow/react**, and **SQLite** (`@tauri-apps/plugin-sql`).

## Features

- Infinite canvas with custom nodes for notes, books, and media (YouTube, cinema, Substack/article, Instagram)
- Open Graph URL import via Rust (`fetch_url_metadata`)
- Apple Notes export import (`.txt` / `.md` / `.html`)
- Open Library book search + covers
- Debounced canvas position autosave
- Filters: All / Notes / Books / Videos / Cinema / Articles / Wishlist

## Develop

```bash
npm install
npm run tauri dev
```

Frontend only (in-memory DB fallback when Tauri APIs are absent):

```bash
npm run dev
```

## Build

```bash
npm run build          # Vite frontend
cargo check --manifest-path src-tauri/Cargo.toml
npm run tauri build    # native installers
```

Release binaries are published by `.github/workflows/release.yml` on `v*` tags.

## Data

SQLite file: `sqlite:archive.db` in the OS app data directory (via Tauri SQL plugin). No hardcoded Windows/Linux paths.

## Design

Visual system follows Athenaeum Minimal (`docs/DESIGN.md`): EB Garamond, Space Mono, Inter, canvas `#EDEDED`, soft paper shadows.
