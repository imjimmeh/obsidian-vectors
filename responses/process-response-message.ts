import { AIMessage } from "@langchain/core/messages";
import type { ToolCall } from "tools/types";

export function processAiResponseMessage(message: string): AIMessage {
	const extracted = extractToolCalls(message);

	return new AIMessage({
		content: extracted.content,
		tool_calls: extracted.toolCalls,
		additional_kwargs: {
			tool_calls: extracted.toolCalls?.map((tool, index) => ({
				id: tool.name + index,
				type: "function",
				function: {
					arguments: JSON.stringify(tool.arguments),
					name: tool.name,
				},
			})),
		},
	});
}

function extractToolCalls(content: string): {
	toolCalls?:ToolCall[];
	content: string;
} {
	const jsonAttempt = tryParseJsonToolCall(content);
	if(jsonAttempt.success){
		return {
			content: content,
			toolCalls: jsonAttempt.toolCalls
		}
	}

	const markdownAttempt = tryParseCodeblocks(content);

	if(markdownAttempt.success){
		return { 
			content: content,
			toolCalls: markdownAttempt.toolCalls
		}
	}
	
	return {
		content: content,
		toolCalls: undefined,
	};
}

function tryParseCodeblocks(content: string): { success: boolean, toolCalls?: ToolCall[]}{
	const codeblockRegex = /`([\s\S]*?)`/gm;
	let match;
	
	while ((match = codeblockRegex.exec(content)) !== null) {
		const code = match[1].split("\n").slice(1).join("\n");
		console.log("Found a code block:", code);
		const parsed = tryParseJsonToolCall(code);
		if(parsed.success){
			return {
				success: true,
				toolCalls: parsed.toolCalls
			};
		}
	}

	return {
		success: false
	}
}

function tryParseJsonToolCall(content: string ): { success: boolean, toolCalls?: ToolCall[]} {
	try {
		const parsed = JSON.parse(content);

		if (parsed && parsed.tool_calls) {
			return {
				success: true, 
				toolCalls: processToolCalls(parsed).toolCalls
			}
		}
	} catch (e) {
	}

	return {
		success: false
	}
}

function processToolCalls(parsed: any) {
	const toolCalls = parsed.tool_calls;

	if(!parsed.tool_calls){
		console.log("Expected tool calls but none found", parsed);
		return {
			toolCalls: undefined,
			content: parsed.content
		};
	}
	if (toolCalls.arguments && !toolCalls.input) {
		toolCalls.input = toolCalls.arguments;
	} else if (!toolCalls.arguments && toolCalls.input) {
		toolCalls.arguments = toolCalls.input;
	}


	return {
		toolCalls: parsed.tool_calls,
		content: "",
	};
}