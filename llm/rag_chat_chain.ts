import {
	Runnable,
	type RunnableConfig,
	RunnableMap,
	RunnablePassthrough,
} from "@langchain/core/runnables";
import type { AIMessage, MessageOptions } from "chat/types";
import BaseChatChain from "./base_chat_chain";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import type { BaseTransformOutputParser } from "@langchain/core/output_parsers";
import type { SimpleChatModel } from "langchain/chat_models/base";
import type { ContentRetriever } from "retrievers/content_retriever";
import { Document } from "@langchain/core/documents";

const prompt = ChatPromptTemplate.fromTemplate(
	"Using the context provided (if any), answer the question from the user.\n\nContext: {context}\n-------\n\nQuestion: {question}"
);

export default class RagChatChain extends BaseChatChain {
	private retriever: ContentRetriever;
	constructor(
		chatModel: SimpleChatModel,
		parser: BaseTransformOutputParser<unknown>,
		retriever: ContentRetriever
	) {
		super(chatModel, prompt, parser);
		this.retriever = retriever;
	}

	createRunnable(): Runnable<any, any, RunnableConfig> {
		const map = RunnableMap.from({
			question: new RunnablePassthrough<string>(),
			docs: (input: string) => this.retriever.invoke(input),
		});

		const chain = map
			.assign({ context: this.formatDocs })
			.assign({ answer: this.baseChain })
			.pick(["answer", "docs"]);

		return chain;
	}

	acceptsOptions(options: MessageOptions): boolean {
		return options.useRag;
	}

	async sendMessage(message: string): Promise<AIMessage> {
		const result = await this.chain.invoke(message);

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

	private formatDocs(input: Record<string, any>): string {
		const { docs } = input;
		return (
			"\n\n" + docs.map((doc: Document) => doc.pageContent).join("\n\n")
		);
	}
}
