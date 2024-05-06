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
import OllamaToolsLlm from "./ollama-tools-llm";
import AgentChatChain from "./agent_chat_chain";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export default class LlmChat {
	plugin: ObsidianVectorPlugin;
	llm: OllamaToolsLlm;
	retriever: ContentRetriever;
	parser = new StringOutputParser();

	private chains: BaseChatChain[] = [];
private agent: AgentChatChain;

	constructor(plugin: ObsidianVectorPlugin) {
		this.plugin = plugin;

		const innerModel = new ChatOllama({
			baseUrl: this.plugin.settings.llmSettings.base_url,
			model: this.plugin.settings.llmSettings.model,
		});

		this.llm = new OllamaToolsLlm({
			baseUrl: this.plugin.settings.llmSettings.base_url,
			model: this.plugin.settings.llmSettings.model,
		}, innerModel);

		this.retriever = new TypedContentRetriever(
			this.plugin.vectorStore!._db,
			this,
			this.plugin
		);

		this.chains.push(
			new RagChatChain(this.llm, this.parser, this.retriever)
		);
		this.chains.push(new SimpleChatChain(this.llm, this.parser));

		this.agent = new AgentChatChain(new OllamaEmbeddings({ baseUrl: this.plugin.settings.llmSettings.base_url}), new RecursiveCharacterTextSplitter({
			chunkSize: 1000,
			chunkOverlap: 200
		}), this.llm, this.parser, this.retriever);
	}

	async sendMessage(
		message: string,
		options: MessageOptions
	): Promise<AIMessage> {

		return this.agent.sendMessage(message);
		
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
