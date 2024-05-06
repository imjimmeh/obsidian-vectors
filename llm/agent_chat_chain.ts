import {
	Runnable,
	type RunnableConfig,
	RunnableMap,
	RunnablePassthrough,
    RunnableSequence
} from "@langchain/core/runnables";
import BaseChatChain from "./base_chat_chain";
import { ChatPromptTemplate, MessagesPlaceholder, PromptTemplate } from "@langchain/core/prompts";
import type { BaseTransformOutputParser } from "@langchain/core/output_parsers";
import type { BaseChatModel } from "langchain/chat_models/base";
import type { ContentRetriever } from "retrievers/content_retriever";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TextSplitter } from "langchain/text_splitter";
import { AgentExecutor } from "langchain/agents";

import {
	OpenAIToolsAgentOutputParser,
	type ToolsAgentStep,
} from "langchain/agents/openai/output_parser";
import { zodToJsonSchema } from "zod-to-json-schema";
import OllamaToolsLlm from "../llm/ollama-tools-llm";
import { createWebBrowser } from "tools/web-browser/webbrowser";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { BaseMessage } from "@langchain/core/messages";
import { formatToOpenAIFunctionMessages } from "langchain/agents/format_scratchpad";
import type { AIMessage as InternalAIMessage, MessageOptions } from "chat/types";
import { z} from "zod";
import RagChatChain from "./rag_chat_chain";

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

const chatPrompt = ChatPromptTemplate.fromMessages([
    ["system", prompt],
    new MessagesPlaceholder(MEMORY_KEY),
    ["user", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
    ]);

    
    
export default class AgentChatChain extends BaseChatChain {
	private retriever: ContentRetriever;

    private ollama: OllamaToolsLlm;
    private tools: DynamicStructuredTool[];
	private outputParser = new OpenAIToolsAgentOutputParser();
	private agentExecutor: AgentExecutor;
    private chatHistory: BaseMessage[] = [];

	constructor(
        embeddings: EmbeddingsInterface,
        textSplitter: TextSplitter,
		chatModel: BaseChatModel,
		parser: BaseTransformOutputParser<unknown>,
		retriever: ContentRetriever
	) {
		super(chatModel, chatPrompt, parser);

        this.ollama = new OllamaToolsLlm({
            model: "llama3:instruct",
            baseUrl: "http://192.168.1.252:11434",
        }, this.chatModel);
    
		this.retriever = retriever;

        const chain = new RagChatChain(this.chatModel, this.parser, this.retriever);

        const tool = new DynamicStructuredTool({
            name: "retriever-tool",
            description: "retrieves information from the user's notes",
            schema: z.object({
              query: z.string().describe("The query to search for"),
            }),
            func: async ({ query }) => {
              const docs = await chain.sendMessage(query);
              return JSON.stringify(docs);
            },
        });
        
        this.tools = [
            createWebBrowser({model: this.chatModel,
                embeddings: embeddings,
                textSplitter: textSplitter
            }),
            tool
        ]
        
        this.agentExecutor = new AgentExecutor({
		agent: this.createRunnable(),
		tools: this.tools,
		verbose: false,
        });
	}
	createRunnable(): Runnable<any, any, RunnableConfig> {
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
                docs: (input: { steps: ToolsAgentStep[];
                    tools: string;
                    tools_schema: string;
                    chat_history: BaseMessage[];
                    input: string;
                }) => this.retriever.invoke(input.input),
            }),
            chatPrompt,
            this.ollama,
            this.outputParser,
        ]);
    
		const map = RunnableMap.from({
			question: new RunnablePassthrough<string>(),
			docs: (input: string) => this.retriever.invoke(input),
		});

		const chain = map
			.assign({ context: this.formatDocs })
			.assign({ answer: this.baseChain })
			.pick(["answer", "docs"]);

		return chain;
	}

	acceptsOptions(options: MessageOptions): boolean {
		return options.useRag;
	}

	async sendMessage(message: string): Promise<InternalAIMessage> {
		const result = await this.agentExecutor.invoke({
            tools: this.toolsToJson().map((tool) => JSON.stringify(tool)).join("\n"),
            input: message,
            tools_schema: toolsSchema,
            chat_history: this.chatHistory
        })

		const sources = this.getSourceDocumentPaths(result);

		return {
			sender: "AI",
			message: result.answer,
			sources,
		};
	}

    private toolsToJson(){
        return this.tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            arguments: zodToJsonSchema(tool.schema),
        }));
    }

	private getSourceDocumentPaths(result: any) {
		return result.docs
			.map((doc: Document) => doc.metadata.filePath)
			.filter(
				(value: string, index: number, array: string[]) =>
					array.indexOf(value) === index
			);
	}

	private formatDocs(input: Record<string, any>): string {
		const { docs } = input;
		return (
			"\n\n" + docs.map((doc: Document) => doc.pageContent).join("\n\n")
		);
	}
}
