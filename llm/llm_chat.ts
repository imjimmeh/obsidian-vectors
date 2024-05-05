import ObsidianVectorPlugin from "vector_plugin";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { StringOutputParser } from "@langchain/core/output_parsers";
import type { AIMessage, MessageOptions } from "../chat/types";
import TypedContentRetriever, {
	ContentRetriever,
} from "retrievers/content_retriever";
import type BaseChatChain from "./base_chat_chain";
import RagChatChain from "./rag_chat_chain";
import SimpleChatChain from "./simple_chat_chain";
import { runAgent } from "agents/ollama-agent";

export default class LlmChat {
	plugin: ObsidianVectorPlugin;
	llm: ChatOllama;
	retriever: ContentRetriever;
	parser = new StringOutputParser();

	private chains: BaseChatChain[] = [];

	constructor(plugin: ObsidianVectorPlugin) {
		this.plugin = plugin;

		this.llm = new ChatOllama({
			baseUrl: this.plugin.settings.llmSettings.base_url,
			model: this.plugin.settings.llmSettings.model,
		});

		this.retriever = new TypedContentRetriever(
			this.plugin.vectorStore!._db,
			this,
			this.plugin
		);

		this.chains.push(
			new RagChatChain(this.llm, this.parser, this.retriever)
		);
		this.chains.push(new SimpleChatChain(this.llm, this.parser));
	}

	async sendMessage(
		message: string,
		options: MessageOptions
	): Promise<AIMessage> {

		return runAgent(message, this.retriever);
		
		for (const chain of this.chains) {
			if (chain.acceptsOptions(options)) {
				return chain.sendMessage(message);
			}
		}

		throw {
			error: "Could not find chat chain that accepts options",
			options: options,
		};
	}
}
