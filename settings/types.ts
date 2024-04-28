export interface ObsidianVectorPluginSettings {
	llmSettings: LlmSettings;
	vectorSettings: VectorDbSettings;
	querySettings: QuerySettings;
}

export interface LlmSettings {
	base_url: string;
	api_key: string;
	model: string;
}

export interface VectorDbSettings {
	store: VectorStore;
	base_url: string;
	dbHasBeenInitialised: boolean;
}

export interface QuerySettings {
	minimumSimilarityScore: number;
}

export enum VectorStore {
	CHROMA = "Chroma",
}
