import { ObsidianVectorPluginSettings, VectorStore } from "./types";

export const DEFAULT_SETTINGS: ObsidianVectorPluginSettings = {
	llmSettings: {
		base_url: 'http://localhost:11434',
		api_key: 'ollama',
		model: 'llama3',
	},
	vectorSettings: {
		store: VectorStore.CHROMA,
		base_url: 'http://localhost:8000',
	}
}