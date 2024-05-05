import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { AgentExecutor } from "langchain/agents";
import {
	ChatPromptTemplate,
	MessagesPlaceholder,
} from "@langchain/core/prompts";
import {
	RunnableSequence,
	RunnablePassthrough,
} from "@langchain/core/runnables";
import {
	OpenAIToolsAgentOutputParser,
	type ToolsAgentStep,
} from "langchain/agents/openai/output_parser";
import { zodToJsonSchema } from "zod-to-json-schema";
import OllamaToolsLlm from "../llm/ollama-tools-llm";
import { ChatMessageHistory } from "langchain/memory";
import { createWebBrowser } from "tools/web-browser/webbrowser";
import type { ContentRetriever } from "retrievers/content_retriever";
import { createRetrieverTool } from "tools/retriever-tool/retriever-tool";


export const runAgent = async (query: string, retriever: ContentRetriever) => {
let ollama = new OllamaToolsLlm({
	model: "llama3:instruct",
	baseUrl: "http://192.168.1.252:11434",
});

const textSplitter = RecursiveCharacterTextSplitter.fromLanguage("html", {
	chunkSize: 500,
	chunkOverlap: 20,
});

const tools = [
	createWebBrowser({
		model: ollama,
		embeddings: new OllamaEmbeddings(),
		textSplitter: textSplitter,
	}),
	createRetrieverTool(retriever),
];

const toolsJson = tools.map((tool) => ({
	name: tool.name,
	description: tool.description,
	arguments: zodToJsonSchema(tool.schema),
}));

const toolsSchema = `{
	"tool_calls": [{
		 "name": "<name of the selected tool>",
		 "arguments": <parameters for the selected tool, matching the tool's JSON schema>
	}]
 }`;
	const prompt = `
	Answer the following questions as best you can. You have access to the following tools:

	{tools}
	
	The way you use the tools is by specifying a JSON blob.		
	The $JSON_BLOB should only contain a SINGLE action, do NOT return a list of multiple actions. Here is an example of a valid $JSON_BLOB: \n`+
	"``` \n"+
	"{tools_schema}"+
	"```"+
	`
	ALWAYS use the following format:
	
	Question: the input question you must answer
	Thought: you should always think about what to do
	Action:`+
	"``` \n"+
	"$JSON_BLOB \n"+
	"``` \n"+
	`Observation: the result of the action
	... (this Thought/Action/Observation can repeat N times)
	Thought: I now know the final answer
	Final Answer: <the final answer to the original input question>
	
	Begin! Reminder to always use the exact characters "Final Answer" when responding, along with the actual final answer to the user's query.`;
	const chatHistory = new ChatMessageHistory();
	
	const MEMORY_KEY = "chat_history";

	const chatPrompt = ChatPromptTemplate.fromMessages([
		["system", prompt],
		new MessagesPlaceholder(MEMORY_KEY),
		["user", "{input}"],
		["ai", "{agent_scratchpad}"],
	]);

	const withTools = ollama.bindTools!(tools) as OllamaToolsLlm;

	const parser = new OpenAIToolsAgentOutputParser();

	const agentWithMemory = RunnableSequence.from([
		RunnablePassthrough.assign({
			agent_scratchpad: (input: { steps: ToolsAgentStep[], tools: string, tools_schema: string, chat_history: ChatMessageHistory, input: string }) => {
				return `Agent scratchpad:
				${input.steps
					.map((step) => JSON.stringify(step))
					.join("\n")}`;
			},
			chat_history:  async (input: { steps: ToolsAgentStep[], tools: string, tools_schema: string, chat_history: ChatMessageHistory, input: string }) => {
				return await input.chat_history.getMessages();
			},
		}),
		chatPrompt,
		withTools,
		parser
	]);
 
	const agentExecutor = new AgentExecutor({
		agent: agentWithMemory,
		tools,
		verbose: false
	});

	const result = await agentExecutor.invoke({
		tools: toolsJson.map((tool) => JSON.stringify(tool)).join("\n"),
		input: query,
		tools_schema: toolsSchema,
		tool_names: toolsJson.map((tool) => tool.name).join(", "),
		chat_history: chatHistory
	});

	return result.output.replace("Final Answer: ", "");
};
