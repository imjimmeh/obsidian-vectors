import { type ObsidianVectorPluginSettings, VectorStore } from "settings/types";
import {
	App,
	Plugin,
	type PluginManifest,
	TAbstractFile,
	TFile,
	WorkspaceLeaf,
} from "obsidian";
import VectorSettingsTab from "settings/settings_tab";
import { DEFAULT_SETTINGS } from "settings/default";
import VectorDb from "vectors/vector_db";
import ChromaStore from "vectors/chroma_store";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import MarkdownFileProcessor from "processors/markdown_file_processor";
import ChatView, { ChatViewType } from "chat/chat_view";
import LlmChat from "llm/llm_chat";

export default class ObsidianVectorPlugin extends Plugin {
	settings: ObsidianVectorPluginSettings = DEFAULT_SETTINGS;
	vectorStore: VectorDb | null = null;
	markdownProcessor: MarkdownFileProcessor;
	llmChat: LlmChat | null = null;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);

		this.markdownProcessor = new MarkdownFileProcessor({ plugin: this });
	}

	async onload() {
		await this.loadSettings();
		await this.initialiseStore();

		this.llmChat = new LlmChat(this);
		this.registerViews();

		this.registerCommands();

		this.addSettingTab(new VectorSettingsTab(this.app, this));

		this.registerEvents();

		this.addRibbonIcons();
	}

	private registerViews() {
		this.registerView(
			ChatViewType,
			(leaf) => new ChatView(this.app, leaf, this.llmChat!)
		);
	}

	private addRibbonIcons() {
		this.addRibbonIcon("message-circle", "Open AI chat", async () => {
			await this.openChatView();
		});
	}

	private registerCommands() {
		this.addCommand({
			id: "initialise-vector-db",
			name: "Initialise Vector DB",
			callback: async () => {
				await this.vectorStore!.initialiseDb();
				await this.markdownProcessor.addAllDocumentsToVectorStore();
			},
		});
	}

	private registerEvents() {
		this.registerEvent(
			this.app.metadataCache.on(
				"changed",
				async (file: TFile) =>
					await this.markdownProcessor.updateFile(file)
			)
		);

		this.registerEvent(
			this.app.metadataCache.on("deleted", async (file: TFile) => {
				await this.markdownProcessor.deleteFile(file.path);
			})
		);

		this.registerEvent(
			this.app.vault.on(
				"rename",
				async (file: TAbstractFile, oldPath: string) => {
					await this.markdownProcessor.deleteFile(oldPath);
					await this.markdownProcessor.addFile(file as TFile);
				}
			)
		);
	}

	onunload() {}

	async openChatView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(ChatViewType);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getRightLeaf(false);
			if (!leaf) {
				return;
			}
			await leaf.setViewState({ type: ChatViewType, active: true });
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		workspace.revealLeaf(leaf);
	}

	async loadSettings() {
		const loadedData = await this.loadData();

		//console.log("Loaded settings ", loadedData);
		if (loadedData) {
			this.settings = {
				...this.settings,
				...loadedData,
			};
		}

		//console.log("Settings", this.settings);
	}

	async saveSettings() {
		await this.saveData(this.settings);

		this.initialiseStore();
	}

	private async initialiseStore() {
		switch (this.settings.vectorSettings.store) {
			case VectorStore.CHROMA: {
				//TODO: Don't reinitialise on setting change, just update settings
				this.vectorStore = new ChromaStore({
					//TODO: Move embeddings to here, update on setting change
					//TODO: Add embeddings to settings
					embeddings: new OllamaEmbeddings({
						baseUrl: "http://192.168.1.252:11434",
					}),
					vault: this.app.vault,
					settings: this.settings.vectorSettings,
				});
				break;
			}
		}
		await this.vectorStore.initialiseDb();
	}
}
