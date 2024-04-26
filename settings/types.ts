export interface ObsidianVectorPluginSettings {
	llmSettings: LlmSettings;
	vectorSettings: VectorDbSettings;
}

export interface LlmSettings {
	base_url: string;
	api_key: string;
	model: string;
}

export interface VectorDbSettings {
	store: VectorStore;
	base_url: string;
}

export enum VectorStore {
	CHROMA = "Chroma"
}