import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
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
import { createWebBrowser } from "tools/web-browser/webbrowser";
import type { ContentRetriever } from "retrievers/content_retriever";
import { createRetrieverTool } from "tools/retriever-tool/retriever-tool";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { BaseMessage, AIMessage } from "@langchain/core/messages";
import { formatToOpenAIFunctionMessages } from "langchain/agents/format_scratchpad";
import type { AgentFinish } from "langchain/agents";

export const runAgent = async (query: string, retriever?: ContentRetriever) => {
	let ollama = new OllamaToolsLlm({
		model: "llama3:instruct",
		baseUrl: "http://192.168.1.252:11434",
	});

	const textSplitter = RecursiveCharacterTextSplitter.fromLanguage("html", {
		chunkSize: 500,
		chunkOverlap: 20,
	});

	const tools: DynamicStructuredTool[] = [
		createWebBrowser({
			model: ollama,
			embeddings: new OllamaEmbeddings(),
			textSplitter: textSplitter,
		}),
	];

	if(retriever){
		tools.push(createRetrieverTool(retriever)	);
	}

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
	const prompt =
		`You are an helpful AI assistant designed to help users with their queries.

 		You have access to the following tools:
		{tools}

		YOU MUST FOLLOW THESE INSTRUCTIONS CAREFULLY.       

		<instructions>                                                                       
		1. To respond to the users message, you can use one of the tools provided    
		above.                                                       
		2. You can only use one tool at a time.                        
		3. If you decide to use a tool, you must respond in the JSON format matching the     
		following schema:                                                                    
		{tools_schema}                                                                                 
		4. To use a tool, just respond with the JSON matching the schema. Nothing else. Do   
		not add any additional notes or explanations                                         
		5. After you use a tool, the next message you get will contain the result of the tool
		call.                                                                                
		6. REMEMBER: To use a tool, you must respond only in JSON format.                    
		7. After you use a tool and receive the result back, respond regularly to answer the 
		users question.                                                                      
		8. Only use the tools you are provided.                                              
		9. Use markdown to format your answers.
		10. When using a tool, ensure your message contains ONLY the JSON blob. DO NOT RESPOND WITH ANY OTHER COMMENTS, INFORMATION, NOTES, ETC.     
		11. Your final response to the user should be a COMPLETE RESPONSE to their query. Even if you have given them some information already, your last message should be a COMPLETE RESPONSE.
		</instructions>`;

	const MEMORY_KEY = "chat_history";

	const chatHistory: BaseMessage[] = [];
	const chatPrompt = ChatPromptTemplate.fromMessages([
		["system", prompt],
		new MessagesPlaceholder(MEMORY_KEY),
		["user", "{input}"],
		new MessagesPlaceholder("agent_scratchpad"),
		]);

	const parser = new OpenAIToolsAgentOutputParser();
	const finalAnswer = "final answer:";
	
	const responseParser = (message: AIMessage) => {
		const messageContent = message.content.toString();
		const indexOfFinalAnswer = messageContent.toLowerCase().indexOf(finalAnswer);

		if(indexOfFinalAnswer == -1){
			return parser.parseAIMessage(message);
		}

		const finalStep: AgentFinish = {
			returnValues: {
				output: messageContent.slice(indexOfFinalAnswer + finalAnswer.length).trim(),
			},
			log: messageContent
		}

		return finalStep;
	}

	const agentWithMemory = RunnableSequence.from([
		RunnablePassthrough.assign({
			agent_scratchpad: (input: {
				steps: ToolsAgentStep[];
				tools: string;
				tools_schema: string;
				chat_history: BaseMessage[];
				input: string;
			}) => {
				return formatToOpenAIFunctionMessages(input.steps);
			},
			chat_history: async (input: {
				steps: ToolsAgentStep[];
				tools: string;
				tools_schema: string;
				chat_history: BaseMessage[];
				input: string;
			}) => {
				console.log("chat history messages", input.chat_history);

				return input.chat_history;
			},
		}),
		chatPrompt,
		ollama,
		responseParser,
	]);

	const agentExecutor = new AgentExecutor({
		agent: agentWithMemory,
		tools,
		verbose: false,
	});

	const result = await agentExecutor.invoke({
		tools: toolsJson.map((tool) => JSON.stringify(tool)).join("\n"),
		input: query,
		tools_schema: toolsSchema,
		tool_names: toolsJson.map((tool) => tool.name).join(", "),
		chat_history: chatHistory
	});

	return result.output;
};
