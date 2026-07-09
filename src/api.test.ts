import { test } from "node:test";
import assert from "node:assert/strict";
import { askServer, reindexServer, formatResult, type HttpPost } from "./api.js";

test("askServer: pega a /api/ask y normaliza la respuesta", async () => {
  let seen = "";
  const post: HttpPost = async (url, body) => {
    seen = url;
    assert.deepEqual(body, { question: "¿qué es X?" });
    return { answer: "X es Y", sources: [{ n: 1, source: "a.md", score: 0.9 }] };
  };
  const r = await askServer("http://host:8787/", "¿qué es X?", post);
  assert.equal(seen, "http://host:8787/api/ask"); // recorta la barra final
  assert.equal(r.answer, "X es Y");
  assert.equal(r.sources.length, 1);
});

test("askServer: respuesta rara -> defaults seguros", async () => {
  const r = await askServer("http://h", "q", async () => ({}));
  assert.equal(r.answer, "");
  assert.deepEqual(r.sources, []);
});

test("reindexServer: devuelve notes/chunks numéricos", async () => {
  const r = await reindexServer("http://h", async () => ({ notes: "3", chunks: "12" }));
  assert.deepEqual(r, { notes: 3, chunks: 12 });
});

test("formatResult: incluye respuesta + fuentes como wikilinks", () => {
  const md = formatResult({ answer: "Respuesta.", sources: [{ n: 1, source: "notas/x.md", score: 0.8 }] });
  assert.ok(md.includes("Respuesta."));
  assert.ok(md.includes("**Fuentes:**"));
  assert.ok(md.includes("[[notas/x]]"));
});

test("formatResult: sin respuesta -> mensaje claro", () => {
  assert.ok(formatResult({ answer: "", sources: [] }).includes("Sin respuesta"));
});
