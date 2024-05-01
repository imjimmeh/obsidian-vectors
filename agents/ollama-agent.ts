import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import {
	AgentExecutor,
	createOpenAIFunctionsAgent,
} from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import OllamaAgentLlm from "./ollama-agent-llm";
import { WebBrowser } from "./webbrowser";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";

const ollama = new OllamaAgentLlm({
	model: "openchat",
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
({
	name: tool.name,
	description: tool.description,
	schema: tool.schema
})
);

const toolsSchema = `{
	"tools": {
		 "tool": "<name of the selected tool>",
		 "tool_input": <parameters for the selected tool, matching the tool's JSON schema
	}
 }`;

export const runAgent = async () => {
	const prompt = `
You have access to the following tools:
{tools}

You MUST follow these instructions:
1. You can select up to one tool at a time to respond to the user's query
2. If you want to use a tool you must respond in the JSON format matching the following schema:
{tools_schema}
3. You will receive a response from the user with the result of the tool.
4. If there is no tool that can help, and you do not know the answer, respond with an empty JSON.
5. Do not add any additional notes or explanations to your response.
6. Once finished, answer the user's query.`;

const chatPrompt = ChatPromptTemplate.fromMessages([
	["system", prompt],
	new MessagesPlaceholder("chat_history"),
	["user", "{input}"],
	["ai", "{agent_scratchpad}"]
]);

	const agent = await createOpenAIFunctionsAgent({
		llm: ollama,
		tools: tools,
		prompt: chatPrompt,
	});

	const agentExecutor = new AgentExecutor({
		agent,
		tools,
		verbose: true
	});

	const result = await agentExecutor.invoke({
		tools: toolsJson.map(tool => JSON.stringify(tool)).join("\n"),
		input: "What is the website https://and.digital about?",
		tools_schema: toolsSchema
	});

	console.log(result);
};
