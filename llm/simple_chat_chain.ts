import type { Runnable, RunnableConfig } from "@langchain/core/runnables";
import type { AIMessage, MessageOptions } from "chat/types";
import BaseChatChain from "./base_chat_chain";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import type { BaseTransformOutputParser } from "@langchain/core/output_parsers";
import type { BaseChatModel, SimpleChatModel } from "langchain/chat_models/base";

const prompt = ChatPromptTemplate.fromTemplate(
	"You are an amazing AI designed to help users with their queries. Answer the question from the user:\n\nQuestion: {question}"
);

export default class SimpleChatChain extends BaseChatChain {
	constructor(
		chatModel: BaseChatModel,
		parser: BaseTransformOutputParser<unknown>
	) {
		super(chatModel, prompt, parser);
	}
	createRunnable(): Runnable<any, any, RunnableConfig> {
		return this.baseChain;
	}

	acceptsOptions(options: MessageOptions): boolean {
		return !options.useRag;
	}

	async sendMessage(message: string): Promise<AIMessage> {
		const result = await this.chain.invoke({
			question: message,
		});

		return {
			sender: "AI",
			message: result,
		};
	}
}
