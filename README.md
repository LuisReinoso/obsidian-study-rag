# Study RAG — Ask your vault (Obsidian plugin)

> **Part of the Study Framework.** The companion to [`study-rag-server`](../study-rag-server):
> this plugin lets you ask questions across your whole vault from inside Obsidian and get answers
> grounded in your own notes, with citations (wikilinks) back to the source.

Todo self-hosted y con **modelos abiertos** (el server usa llama.cpp/Ollama). El plugin solo habla
HTTP con tu `study-rag-server`.

## Comandos

- **Ask your vault (RAG)** — abre un modal, escribes la pregunta (Cmd/Ctrl+Enter para enviar), y
  muestra la respuesta con las fuentes como wikilinks.
- **Ask your vault: usar selección como pregunta** — toma el texto seleccionado como pregunta.

## Ajustes

- **Servidor RAG**: URL de `study-rag-server` (default `http://127.0.0.1:8787`).
- **Reindexar vault**: dispara `POST /api/index` en el server (trocea + embebe tus notas).

## Instalar (dev)

```bash
pnpm install
pnpm test        # tests de la lógica (llamada + formato), node:test
pnpm build       # typecheck + bundle a main.js
```

Copia `main.js`, `manifest.json` y `styles.css` a `<vault>/.obsidian/plugins/obsidian-study-rag/`
y actívalo en Obsidian. Asegúrate de tener `study-rag-server` corriendo.

## Diseño

La lógica de red y formato (`src/api.ts`) es **pura y testeada** (el HTTP se inyecta, así corre sin
red en los tests y usa `requestUrl` de Obsidian en runtime para evitar CORS). `src/main.ts` es solo
el pegamento con la API de Obsidian (comandos, modal, settings).
