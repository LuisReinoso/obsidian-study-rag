import {
  App, Editor, MarkdownRenderer, Modal, Notice, Plugin, PluginSettingTab, Setting, requestUrl,
} from "obsidian";
import { askServer, reindexServer, formatResult, type HttpPost, type AskResponse } from "./api.js";

interface StudyRagSettings {
  serverUrl: string;
}
const DEFAULT_SETTINGS: StudyRagSettings = { serverUrl: "http://127.0.0.1:8787" };

// HTTP vía Obsidian (evita CORS). Inyectado en la lógica pura de api.ts.
const post: HttpPost = async (url, body) => {
  const res = await requestUrl({
    url,
    method: "POST",
    contentType: "application/json",
    body: JSON.stringify(body),
    throw: false,
  });
  if (res.status >= 400) throw new Error(`${res.status}: ${res.text?.slice(0, 200)}`);
  return res.json;
};

export default class StudyRagPlugin extends Plugin {
  settings: StudyRagSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: "ask-your-vault",
      name: "Ask your vault (RAG)",
      callback: () => new AskModal(this.app, this).open(),
    });

    this.addCommand({
      id: "ask-your-vault-selection",
      name: "Ask your vault: usar selección como pregunta",
      editorCallback: (editor: Editor) => {
        const q = editor.getSelection().trim();
        if (!q) return new Notice("Selecciona texto para usarlo como pregunta.");
        new AskModal(this.app, this, q).open();
      },
    });

    this.addSettingTab(new StudyRagSettingTab(this.app, this));
  }

  async ask(question: string): Promise<AskResponse> {
    return askServer(this.settings.serverUrl, question, post);
  }

  async reindex(): Promise<void> {
    new Notice("Reindexando el vault...");
    try {
      const r = await reindexServer(this.settings.serverUrl, post);
      new Notice(`Indexado: ${r.notes} notas, ${r.chunks} chunks.`);
    } catch (e: any) {
      new Notice(`Error al reindexar: ${e.message}`);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class AskModal extends Modal {
  constructor(app: App, private plugin: StudyRagPlugin, private prefill = "") {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: "Pregunta a tu vault" });

    const input = contentEl.createEl("textarea", {
      attr: { rows: "3", placeholder: "¿Qué dicen mis notas sobre...?", style: "width:100%" },
    });
    input.value = this.prefill;

    const result = contentEl.createDiv({ cls: "study-rag-result" });
    const btn = contentEl.createEl("button", { text: "Preguntar", cls: "mod-cta" });

    const run = async () => {
      const q = input.value.trim();
      if (!q) return;
      btn.disabled = true;
      result.setText("Buscando en tus notas...");
      try {
        const res = await this.plugin.ask(q);
        result.empty();
        await MarkdownRenderer.render(this.app, formatResult(res), result, "", this.plugin);
      } catch (e: any) {
        result.setText(`Error: ${e.message}`);
      } finally {
        btn.disabled = false;
      }
    };

    btn.onclick = run;
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && (ev.metaKey || ev.ctrlKey)) run();
    });
    input.focus();
  }

  onClose() {
    this.contentEl.empty();
  }
}

class StudyRagSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: StudyRagPlugin) {
    super(app, plugin);
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Servidor RAG")
      .setDesc("URL de study-rag-server (self-hosted).")
      .addText((t) =>
        t
          .setPlaceholder("http://127.0.0.1:8787")
          .setValue(this.plugin.settings.serverUrl)
          .onChange(async (v) => {
            this.plugin.settings.serverUrl = v.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Reindexar vault")
      .setDesc("Trocea y embebe tus notas en el servidor. Correr tras cambios grandes.")
      .addButton((b) => b.setButtonText("Reindexar").setCta().onClick(() => this.plugin.reindex()));
  }
}
