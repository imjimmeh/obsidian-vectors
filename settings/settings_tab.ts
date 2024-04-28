import ObsidianVectorPlugin from "vector_plugin";
import { App, ButtonComponent, PluginSettingTab, Setting } from "obsidian";
import { DEFAULT_SETTINGS } from "./default";

export default class VectorSettingsTab extends PluginSettingTab {
	plugin: ObsidianVectorPlugin;

	constructor(app: App, plugin: ObsidianVectorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		this.addLlmSettings(containerEl);
		this.addVectorSettings(containerEl);
	}

	private addLlmSettings(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName("LLM Base URL")
			.setDesc("Base URL for LLM API")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.llmSettings.base_url)
					.setValue(this.plugin.settings.llmSettings.base_url)
					.onChange(async (value) => {
						this.plugin.settings.llmSettings.base_url = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("LLM Model")
			.setDesc("What model to use")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.llmSettings.model)
					.setValue(this.plugin.settings.llmSettings.model)
					.onChange(async (value) => {
						this.plugin.settings.llmSettings.model = value;
						await this.plugin.saveSettings();
					})
			);

		new ButtonComponent(containerEl)
			.setButtonText("Delete container")
			.setWarning()
			.setTooltip("This will delete all vector settings!")
			.setDisabled(
				!this.plugin.settings.vectorSettings.dbHasBeenInitialised
			)
			.onClick(async () => {
				await this.plugin!.vectorStore!.deleteCollection();
				this.plugin.settings.vectorSettings.dbHasBeenInitialised =
					false;
			});

		new ButtonComponent(containerEl)
			.setButtonText("Initialise container")
			.setTooltip("This will start embedding all your documents.")
			.setDisabled(
				this.plugin.settings.vectorSettings.dbHasBeenInitialised
			)
			.onClick(async () => {
				await this.plugin.vectorStore!.initialiseDb();
				await this.plugin.markdownProcessor.addAllDocumentsToVectorStore();
				this.plugin.settings.vectorSettings.dbHasBeenInitialised = true;
			});
	}

	private addVectorSettings(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName("Vector DB Base URL")
			.setDesc("Base URL for Vector DB Store")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.vectorSettings.base_url)
					.setValue(this.plugin.settings.vectorSettings.base_url)
					.onChange(async (value) => {
						this.plugin.settings.vectorSettings.base_url = value;
						await this.plugin.saveSettings();
					})
			);

		//TODO: dropdown of vector store
		/*
		new Setting(containerEl)
			.setName("LLM Model")
			.setDesc("What model to use")
			.addText((text) =>
				text
					.setPlaceholder("llama3")
					.setValue(this.plugin.settings.llmSettings.model)
					.onChange(async (value) => {
						this.plugin.settings.llmSettings.model = value;
						await this.plugin.saveSettings();
					})
			);
			*/
	}
}
