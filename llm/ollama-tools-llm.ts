import {
	OllamaFunctions,
	type OllamaFunctionsInput,
} from "langchain/experimental/chat_models/ollama_functions";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import {
	BaseMessage,
	AIMessage,
	AIMessageChunk,
	ToolMessage
} from "@langchain/core/messages";
import type {
	OllamaCallOptions,
} from "@langchain/community/dist/utils/ollama";
import type { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import type { ChatResult } from "@langchain/core/outputs";
import { type StructuredToolInterface } from "@langchain/core/tools";
import { type RunnableInterface } from "@langchain/core/runnables";
import type { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import { convertToOpenAITool } from "@langchain/core/utils/function_calling";
import { BaseChatModel } from "langchain/chat_models/base";
import type { OllamaToolsChatOptions } from "../agents/types";
import { processAiResponseMessage } from "responses/process-response-message";

export default class OllamaToolsLlm extends BaseChatModel<OllamaToolsChatOptions> {
	tools: StructuredToolInterface[] | undefined;

	private innerModel: ChatOllama;

	constructor(fields: OllamaFunctionsInput) {
		super(fields);
		this.innerModel = new ChatOllama(fields);
	}

	override bindTools(
		tools: (Record<string, unknown> | StructuredToolInterface)[],
		kwargs?: Partial<OllamaCallOptions>
	): RunnableInterface<
		BaseLanguageModelInput,
		AIMessageChunk,
		OllamaCallOptions
	> {
		const mapped = tools.map(convertToOpenAITool);

		const bound = this.bind({
			tools: mapped,
			functions: mapped.map((f) => f.function),
			...kwargs,
		} as Partial<OllamaCallOptions>);

		return bound;
	}

	_llmType(): string {
		return "ollama-agent-llm";
	}

	override async _generate(
		messages: BaseMessage[],
		options: this["ParsedCallOptions"],
		runManager?: CallbackManagerForLLMRun | undefined
	): Promise<ChatResult> {
		{			
			if (!messages.length) {
				throw new Error("No messages provided");
			}

			if (typeof messages[0].content !== "string") {
				throw new Error("Multimodal messages are not supported");
			}

			messages = messages.map(message => {
				if(message._getType() == "function" || message._getType() == "tool"){
					return new AIMessage({
						content: message.content,
					});
				}

				return message;
			});
			
			const result = await this.innerModel._generate(
				messages,
				options,
				runManager
			);
			
			const generations = result.generations
				.map((generation) => processAiResponseMessage(generation.text))
				.map((aiMessage) => ({
					message: aiMessage,
					text: aiMessage.content.toString(),
				}));

			return {
				generations: generations,
				llmOutput: result.llmOutput
			};
		}
	}
}
