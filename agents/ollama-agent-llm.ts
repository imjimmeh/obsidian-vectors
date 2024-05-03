import { OllamaFunctions, type OllamaFunctionsInput } from "langchain/experimental/chat_models/ollama_functions";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { BaseMessage, AIMessageChunk, ToolMessage } from "@langchain/core/messages";
import type { OllamaCallOptions, OllamaInput, OllamaMessage } from "@langchain/community/dist/utils/ollama";
import type { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import type { ChatResult } from "@langchain/core/outputs";
import { SystemMessagePromptTemplate } from "@langchain/core/prompts";
import { AIMessage } from "@langchain/core/messages";
import { type StructuredToolInterface } from "@langchain/core/tools";
import {
	type RunnableInterface,
  } from "@langchain/core/runnables";
  import type {
	BaseLanguageModelInput,
} from "@langchain/core/language_models/base";
import { convertToOpenAITool } from "@langchain/core/utils/function_calling";

export default class OllamaAgentLlm extends OllamaFunctions {

	constructor(fields: OllamaFunctionsInput){
		super(fields);
		this.llm = new OllamaOverride(fields);
	}
	
	override bindTools(
		tools: (Record<string, unknown> | StructuredToolInterface)[],
		kwargs?: Partial<OllamaCallOptions>
	  ): RunnableInterface<BaseLanguageModelInput, AIMessageChunk, OllamaCallOptions> {
		const mapped = tools.map(convertToOpenAITool);

		console.log('existing functions', (this as any).functions);
		const bound = this.bind({
		  tools: mapped,
		  functions: mapped.map(f => f.function),
		  ...kwargs,
		} as Partial<OllamaCallOptions>);

		return bound;
	  }

	  
	override async _generate(messages: BaseMessage[], options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun | undefined): Promise<ChatResult> {
		let functions = options.functions ?? [];
		if (options.function_call !== undefined) {
		  functions = functions.filter(
			(fn) => fn.name === options.function_call?.name
		  );
		  if (!functions.length) {
			throw new Error(
			  `If "function_call" is specified, you must also pass a matching function in "functions".`
			);
		  }
		} else if (functions.length === 0) {
		  functions.push(this.defaultResponseFunction);
		}
		const systemPromptTemplate = SystemMessagePromptTemplate.fromTemplate(
		  this.toolSystemPromptTemplate
		);

		const systemMessage = await systemPromptTemplate.format({
		  tools: JSON.stringify(functions, null, 2),
		});

		const chatResult = await this.llm._generate(
		  [systemMessage, ...messages],
		  options,
		  runManager
		);

		const chatGenerationContent = chatResult.generations[0].message.content;
		if (typeof chatGenerationContent !== "string") {
		  throw new Error("OllamaFunctions does not support non-string output.");
		}
		let parsedChatResult;
		console.log('response', chatResult.generations[0].message.content);
		try {
		  parsedChatResult = JSON.parse(chatGenerationContent);
		} catch (e) {
			console.log('nonJSON response', e, parsedChatResult);
		  return {
			generations: [
			  {
				message: new AIMessage({
				  content: chatGenerationContent,
				}),
				text: chatGenerationContent,
			  },
			],
		  }
		}
		const calledToolName = parsedChatResult.tool;
		const calledToolArguments = parsedChatResult.tool_input;
		const calledTool = functions.find((fn) => fn.name === calledToolName);

		if (calledTool === undefined) {
			console.log('TOOLS', functions, (options as any).tools!);
		  throw new Error(
			`Failed to parse a function call from ${this.llm.model} output: ${chatGenerationContent}`
		  );
		}
		if (calledTool.name === this.defaultResponseFunction.name) {
		  return {
			generations: [
			  {
				message: new ToolMessage({
				  content: calledToolArguments.response,
				  tool_call_id: calledToolName + messages.length
				}),
				text: calledToolArguments.response,
			  },
			],
		  };
		}
	
		const responseMessageWithFunctions = new AIMessage({
		  content: "",
		  additional_kwargs: {
			function_call: {
			  name: calledToolName,
			  arguments: calledToolArguments
				? JSON.stringify(calledToolArguments)
				: "",
			},
		  }});

		  return {
			generations: [{ message: responseMessageWithFunctions, text: "" }],
		  };
		}
}

class OllamaOverride extends ChatOllama {
	protected override _convertMessagesToOllamaMessages(
		messages: BaseMessage[]
	): OllamaMessage[] {
		return messages.map((message) => {
			let role;
			if (message._getType() === "human") {
				role = "user";
			} else if (message._getType() === "ai") {
				role = "assistant";
			} else if (message._getType() === "system") {
				role = "system";
			} else if(message._getType() === "function" || message._getType() == "tool") {
				role = "user";
			}
			else 
			{
				throw `Cannot process message of type ${message._getType()}`;
			}

			let content = "";
			const images = [];
			
			if (typeof message.content === "string") {
				content = message.content;
			} else {
				for (const contentPart of message.content) {
					if (contentPart.type === "text") {
						content = `${content}\n${contentPart.text}`;
					} else if (
						contentPart.type === "image_url" &&
						typeof contentPart.image_url === "string"
					) {
						const imageUrlComponents =
							contentPart.image_url.split(",");
						// Support both data:image/jpeg;base64,<image> format as well
						images.push(
							imageUrlComponents[1] ?? imageUrlComponents[0]
						);
					} else {
						throw new Error(
							`Unsupported message content type. Must either have type "text" or type "image_url" with a string "image_url" field.`
						);
					}
				}
			}

			return {
				role,
				content,
				images,
			};
		});
	}
}
