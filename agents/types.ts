import type { BaseChatModelParams } from "langchain/chat_models/base";
import type { ChatOpenAICallOptions } from "langchain/chat_models/openai";
import type { ChatOllamaInput } from "@langchain/community/chat_models/ollama";

export type OllamaToolsChatOptions = BaseChatModelParams & ChatOpenAICallOptions & ChatOllamaInput & {
model: string;
}