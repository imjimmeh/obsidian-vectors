import { ObsidianVectorPluginSettings, VectorStore } from "settings/types";
import {
	App,
	CachedMetadata,
	Plugin,
	PluginManifest,
	TAbstractFile,
	TFile,
} from "obsidian";
import VectorSettingsTab from "settings/settings_tab";
import { DEFAULT_SETTINGS } from "settings/default";
import VectorDb from "vectors/vector_store";
import ChromaStore from "vectors/chroma_store";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import MarkdownFileProcessor from "files/markdown_file_processor";

export default class ObsidianVectorPlugin extends Plugin {
	settings: ObsidianVectorPluginSettings = DEFAULT_SETTINGS;
	vectorStore: VectorDb;
	markdownProcessor: MarkdownFileProcessor;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);

		this.markdownProcessor = new MarkdownFileProcessor({ plugin: this });
	}

	async onload() {
		await this.loadSettings();
		await this.initialiseStore();
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "initialise-vector-db",
			name: "Initialise Vector DB",
			callback: async () => {
				this.vectorStore.initialiseDb();
				this.markdownProcessor.addAllDocumentsToVectorStore();
			},
		});

		this.addSettingTab(new VectorSettingsTab(this.app, this));

		this.registerEvent(
			this.app.metadataCache.on("changed", (file: TFile) =>
				this.markdownProcessor.updateFile(file)
			)
		);

		this.registerEvent(
			this.app.metadataCache.on("deleted", (file: TFile) =>
				this.markdownProcessor.deleteFile(file.path)
			)
		);

		this.registerEvent(
			this.app.vault.on(
				"rename",
				async (file: TFile, oldPath: string) => {
					await this.markdownProcessor.deleteFile(oldPath);
					await this.markdownProcessor.addFile(file);
				}
			)
		);
	}

	onunload() {}

	async loadSettings() {
		const loadedData = await this.loadData();

		console.log("Loaded settings ", loadedData);
		if (loadedData) {
			this.settings = loadedData;
		}
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
