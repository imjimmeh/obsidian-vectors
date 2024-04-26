export interface ObsidianVectorPluginSettings {
	llmSettings: LlmSettings;
}

export interface LlmSettings {
	base_url: string;
	api_key: string;
	model: string;
}
