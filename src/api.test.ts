import { test } from "node:test";
import assert from "node:assert/strict";
import { askServer, reindexServer, formatResult, type HttpPost } from "./api.js";

test("askServer: hits /api/ask and normalizes the response", async () => {
  let seen = "";
  const post: HttpPost = async (url, body) => {
    seen = url;
    assert.deepEqual(body, { question: "what is X?" });
    return { answer: "X is Y", sources: [{ n: 1, source: "a.md", score: 0.9 }] };
  };
  const r = await askServer("http://host:8787/", "what is X?", post);
  assert.equal(seen, "http://host:8787/api/ask"); // trailing slash trimmed
  assert.equal(r.answer, "X is Y");
  assert.equal(r.sources.length, 1);
});

test("askServer: odd response -> safe defaults", async () => {
  const r = await askServer("http://h", "q", async () => ({}));
  assert.equal(r.answer, "");
  assert.deepEqual(r.sources, []);
});

test("reindexServer: returns numeric notes/chunks", async () => {
  const r = await reindexServer("http://h", async () => ({ notes: "3", chunks: "12" }));
  assert.deepEqual(r, { notes: 3, chunks: 12 });
});

test("formatResult: includes answer + sources as wikilinks", () => {
  const md = formatResult({ answer: "Answer.", sources: [{ n: 1, source: "notes/x.md", score: 0.8 }] });
  assert.ok(md.includes("Answer."));
  assert.ok(md.includes("**Sources:**"));
  assert.ok(md.includes("[[notes/x]]"));
});

test("formatResult: no answer -> clear message", () => {
  assert.ok(formatResult({ answer: "", sources: [] }).includes("No answer"));
});
