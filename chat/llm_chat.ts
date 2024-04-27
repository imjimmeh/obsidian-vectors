import ObsidianVectorPlugin from "vector_plugin";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Runnable, type RunnableConfig } from "@langchain/core/runnables";
import type { ParamsFromFString } from "@langchain/core/prompts";

export default class LlmChat {
	plugin: ObsidianVectorPlugin;
	llm: ChatOllama;

	prompt = ChatPromptTemplate.fromTemplate("{question}");
	parser = new StringOutputParser();

	chain: Runnable<ParamsFromFString<"{question">, string, RunnableConfig>;

	constructor(plugin: ObsidianVectorPlugin) {
		this.plugin = plugin;

		this.llm = new ChatOllama({
			baseUrl: this.plugin.settings.llmSettings.base_url,
			model: this.plugin.settings.llmSettings.model,
		});

		this.chain = this.prompt.pipe(this.llm).pipe(this.parser);
	}

	async sendMessage(message: string): Promise<string> {
		console.log(`Sending message: "${message}"`);
		const result = await this.chain.invoke({ question: message });
		console.log(`Received response: "${result}"`);
		return result;
	}
}
