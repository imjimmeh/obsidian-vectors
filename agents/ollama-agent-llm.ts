import { OllamaFunctions } from "langchain/experimental/chat_models/ollama_functions";
import { ChatOllama } from "@langchain/community/chat_models/ollama";

export default class OllamaAgentLlm extends OllamaFunctions {}

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
			} else {
				role = "assistant";
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
