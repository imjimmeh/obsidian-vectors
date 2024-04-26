import { ObsidianVectorPluginSettings, VectorStore } from "settings/types";
import { App, Editor, MarkdownView, Notice, Plugin } from "obsidian";
import SampleModal from "modal";
import VectorSettingsTab from "settings/settings_tab";
import { DEFAULT_SETTINGS } from "settings/default";
import {
	initialiseVectorStore,
	queryVectorStore,
} from "embeddings/process_markdown_file";
import VectorDb from "vectors/vector_store";
import ChromaStore from "vectors/chroma_store";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";

export default class ObsidianVectorPlugin extends Plugin {
	settings: ObsidianVectorPluginSettings;
	vectorStore: VectorDb;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"dice",
			"Sample Plugin",
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new Notice("This is a notice!");
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-sample-modal-simple",
			name: "Open sample modal (simple)",
			callback: () => {
				new SampleModal(this.app).open();
			},
		});

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "initialise-vector-db",
			name: "Initialise Vector DB",
			callback: async () => {
				const vault = this.app.vault;
				await queryVectorStore(vault);
				/*
				const vaultPath = await initialiseVectorStore(
					vault.getMarkdownFiles(),
					vault
				);
				*/
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new VectorSettingsTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
		});

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

		switch(this.settings.vectorSettings.store){
			case VectorStore.CHROMA:{
				this.vectorStore = new ChromaStore({ embeddings: new OllamaEmbeddings({ baseUrl: this.settings.llmSettings.base_url }),
													vault: this.app.vault,
													settings: this.settings.vectorSettings });
				break;
			}
		}
	}
}
