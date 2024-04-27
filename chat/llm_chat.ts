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

		const retriever = this.plugin.vectorStore!._db.asRetriever(50);

		// subchain for generating an answer once we've done retrieval
		const answerChain = this.prompt.pipe(this.llm).pipe(this.parser);

		const map = RunnableMap.from({
			question: new RunnablePassthrough(),
			docs: retriever,
		});

		// complete chain that calls the retriever -> formats docs to string -> runs answer subchain -> returns just the answer and retrieved docs.
		const chain = map
			.assign({ context: this.formatDocs })
			.assign({ answer: answerChain })
			.pick(["answer", "docs"]);

		this.chain = chain;
	}

	async sendMessage(message: string): Promise<string> {
		console.log(`Sending message: "${message}"`);
		const result = await this.chain.invoke(message);

		console.log("Received result:", result);
		const sources = result.docs
			.map((doc: Document) => doc.metadata.filePath)
			.filter(
				(value: string, index: number, array: string[]) =>
					array.indexOf(value) === index
			);

		return result.answer + "\n\n\nSource:\n" + sources.join("\n");
	}

	formatDocs(input: Record<string, any>): string {
		const { docs } = input;
		return (
			"\n\n" + docs.map((doc: Document) => doc.pageContent).join("\n\n")
		);
	}
}
