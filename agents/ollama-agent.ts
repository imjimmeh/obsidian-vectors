import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { OllamaFunctions } from "langchain/experimental/chat_models/ollama_functions";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { z } from "zod";
import { OpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "langchain/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { WebBrowser } from "langchain/tools/webbrowser";
import {
	AgentExecutor,
	createOpenAIFunctionsAgent,
	createOpenAIToolsAgent,
} from "langchain/agents";
import { pull } from "langchain/hub";
import { ChatOpenAI } from "@langchain/openai";
import type { ChatPromptTemplate } from "@langchain/core/prompts";

const ollama = new OllamaFunctions({
	model: "llama3",
	baseUrl: "http://192.168.1.252:11434",
});

const textSplitter = RecursiveCharacterTextSplitter.fromLanguage("html", {
	chunkSize: 500,
	chunkOverlap: 20,
});

const tools = [
	new WebBrowser({
		model: ollama,
		embeddings: new OllamaEmbeddings(),
		textSplitter: textSplitter,
	}),
];

const toolsJson = tools.map((tool) =>
	StructuredOutputParser.fromZodSchema(tool.schema)
);

export const runAgent = async () => {
	const prompt = await pull<ChatPromptTemplate>(
		"hwchase17/openai-tools-agent"
	);

	const agent = await createOpenAIFunctionsAgent({
		llm: ollama,
		tools: tools,
		prompt: prompt,
	});

	const agentExecutor = new AgentExecutor({
		agent,
		tools,
	});

	const result = await agentExecutor.invoke({
		input: "What is the website https://and.digital about?",
	});

	console.log(result);
};

runAgent().then(() => console.log("done"));
