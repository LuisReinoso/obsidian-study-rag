// Pure, testable logic: talk to study-rag-server and format the result. The HTTP call
// is injected so tests run without network and runtime can use Obsidian's requestUrl.

export interface AskResponse {
  answer: string;
  sources: Array<{ n: number; source: string; score: number }>;
}

export type HttpPost = (url: string, body: unknown) => Promise<any>;

const clean = (u: string) => u.replace(/\/+$/, "");

export async function askServer(serverUrl: string, question: string, post: HttpPost): Promise<AskResponse> {
  const data = await post(`${clean(serverUrl)}/api/ask`, { question });
  return {
    answer: typeof data?.answer === "string" ? data.answer : "",
    sources: Array.isArray(data?.sources) ? data.sources : [],
  };
}

export async function reindexServer(serverUrl: string, post: HttpPost): Promise<{ notes: number; chunks: number }> {
  const data = await post(`${clean(serverUrl)}/api/index`, {});
  return { notes: Number(data?.notes ?? 0), chunks: Number(data?.chunks ?? 0) };
}

export function formatResult(res: AskResponse): string {
  if (!res.answer) return "_No answer from the server._";
  const src = res.sources.length
    ? "\n\n**Sources:**\n" + res.sources.map((s) => `- [${s.n}] [[${s.source.replace(/\.md$/, "")}]]`).join("\n")
    : "";
  return `${res.answer}${src}`;
}
