# Study RAG — Ask your vault (Obsidian plugin)

> **Part of the Study Framework.** The companion to [`study-rag-server`](https://github.com/LuisReinoso/study-rag-server):
> this plugin lets you ask questions across your whole vault from inside Obsidian and get answers
> grounded in your own notes, with citations (wikilinks) back to the source.

Fully self-hosted and **open models only** (the server runs llama.cpp/Ollama). The plugin only speaks
HTTP with your `study-rag-server`.

## Commands

- **Ask your vault (RAG)** — opens a modal, you type the question (Cmd/Ctrl+Enter to send), and it
  shows the answer with the sources as wikilinks.
- **Ask your vault: use selection as the question** — takes the selected text as the question.

## Settings

- **RAG server**: URL of `study-rag-server` (default `http://127.0.0.1:8787`).
- **Reindex vault**: triggers `POST /api/index` on the server (chunk + embed your notes).

## Install (dev)

```bash
pnpm install
pnpm test        # tests for the logic (request + formatting), node:test
pnpm build       # typecheck + bundle to main.js
```

Copy `main.js`, `manifest.json` and `styles.css` into
`<vault>/.obsidian/plugins/obsidian-study-rag/` and enable it in Obsidian. Make sure
`study-rag-server` is running.

## Design

The network and formatting logic (`src/api.ts`) is **pure and unit-tested** — the HTTP call is
injected, so tests run with no network and runtime uses Obsidian's `requestUrl` to avoid CORS.
`src/main.ts` is just the glue with the Obsidian API (commands, modal, settings).
