import ObsidianVectorPlugin from "vector_plugin";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
	Runnable,
	type RunnableConfig,
	RunnableSequence,
	RunnablePassthrough,
	RunnableMap,
} from "@langchain/core/runnables";
import type { ParamsFromFString } from "@langchain/core/prompts";
import { formatDocumentsAsString } from "langchain/util/document";

import { Document } from "@langchain/core/documents";
import type { AIMessage } from "./message";

const MinSimilarityScore = 0.65;

export default class LlmChat {
	plugin: ObsidianVectorPlugin;
	llm: ChatOllama;

	prompt = ChatPromptTemplate.fromTemplate(
		"Using the context provided (if any), answer the question from the user.\n\nContext: {context}\n-------\n\nQuestion: {question}"
	);

	parser = new StringOutputParser();

	chain: Runnable<any, any, RunnableConfig>;

	constructor(plugin: ObsidianVectorPlugin) {
		this.plugin = plugin;

		this.llm = new ChatOllama({
			baseUrl: this.plugin.settings.llmSettings.base_url,
			model: this.plugin.settings.llmSettings.model,
		});

		const answerChain = this.prompt.pipe(this.llm).pipe(this.parser);

		const map = RunnableMap.from({
			question: new RunnablePassthrough<string>(),
			docs: async (input: string) => {
				return await this.getDocsBySimilarity(input);
			},
		});

		const chain = map
			.assign({ context: this.formatDocs })
			.assign({ answer: answerChain })
			.pick(["answer", "docs"]);

		this.chain = chain;
	}

	private async getDocsBySimilarity(input: string) {
		const results =
			await this.plugin.vectorStore?._db.similaritySearchWithScore(
				input,
				10
			);

		const filtered = results!
			.filter((result) => result[1] > MinSimilarityScore)
			.map((result) => result[0]);

		return filtered;
	}

	async sendMessage(message: string): Promise<AIMessage> {
		const result = await this.chain.invoke(message);

		console.log(result);

		const sources = this.getSourceDocumentPaths(result);

		return {
			sender: "AI",
			message: result.answer,
			sources,
		};
	}

	private getSourceDocumentPaths(result: any) {
		return result.docs
			.map((doc: Document) => doc.metadata.filePath)
			.filter(
				(value: string, index: number, array: string[]) =>
					array.indexOf(value) === index
			);
	}

	formatDocs(input: Record<string, any>): string {
		const { docs } = input;
		return (
			"\n\n" + docs.map((doc: Document) => doc.pageContent).join("\n\n")
		);
	}
}