import { ObsidianVectorPluginSettings, VectorStore } from "settings/types";
import { App, Notice, Plugin, PluginManifest } from "obsidian";
import SampleModal from "modal";
import VectorSettingsTab from "settings/settings_tab";
import { DEFAULT_SETTINGS } from "settings/default";
import VectorDb from "vectors/vector_store";
import ChromaStore from "vectors/chroma_store";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import MarkdownFileProcessor from "files/markdown_file_processor";

export default class ObsidianVectorPlugin extends Plugin {
	settings: ObsidianVectorPluginSettings;
	vectorStore: VectorDb;
	markdownProcessor: MarkdownFileProcessor = new MarkdownFileProcessor();

	async onload() {
		await this.loadSettings();
		await this.initialiseStore();
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "initialise-vector-db",
			name: "Initialise Vector DB",
			callback: async () => {
				this.vectorStore.initialiseDb();
				this.markdownProcessor.addAllDocumentsToVectorStore(this);
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new VectorSettingsTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
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
