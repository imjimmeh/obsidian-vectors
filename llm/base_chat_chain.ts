import { Runnable } from "@langchain/core/runnables";

import { BaseTransformOutputParser } from "@langchain/core/output_parsers";
import type { AIMessage, MessageOptions } from "chat/types";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { BaseChatModel, SimpleChatModel } from "langchain/chat_models/base";

export default abstract class BaseChatChain {
	chatModel: BaseChatModel;
	prompt: ChatPromptTemplate;
	parser: BaseTransformOutputParser<unknown>;

	protected baseChain: Runnable;
	private _runnable: Runnable;

	constructor(
		chatModel: BaseChatModel,
		prompt: ChatPromptTemplate,
		parser: BaseTransformOutputParser<unknown>
	) {
		this.chatModel = chatModel;
		this.prompt = prompt;
		this.parser = parser;

		this.baseChain = this.createBaseChain();
		this._runnable = this.createRunnable();
	}

	get chain(): Runnable {
		return this._runnable;
	}

	abstract createRunnable(): Runnable;

	abstract sendMessage(message: string): Promise<AIMessage>;

	protected createBaseChain() {
		return this.prompt.pipe(this.chatModel).pipe(this.parser);
	}

	abstract acceptsOptions(options: MessageOptions): boolean;
}
