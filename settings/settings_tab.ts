import ObsidianVectorPlugin from "vector_plugin";
import { App, PluginSettingTab, Setting } from "obsidian";

export default class VectorSettingsTab extends PluginSettingTab {
	plugin: ObsidianVectorPlugin;

	constructor(app: App, plugin: ObsidianVectorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('LLM Base URL')
			.setDesc('Base URL for LLM API')
			.addText(text => text
				.setPlaceholder('http://localhost:11434')
				.setValue(this.plugin.settings.llmSettings.base_url)
				.onChange(async (value) => {
					this.plugin.settings.llmSettings.base_url = value;
					await this.plugin.saveSettings();
				}));

        new Setting(containerEl)
            .setName('LLM Model')
            .setDesc('What model to use')
            .addText(text => text
                    .setPlaceholder('llama3')
                    .setValue(this.plugin.settings.llmSettings.model)
                    .onChange(async (value) => {
                        this.plugin.settings.llmSettings.model = value;
                        await this.plugin.saveSettings();
                    }));
	}
}
