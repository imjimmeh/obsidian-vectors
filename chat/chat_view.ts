import { ItemView, View, WorkspaceLeaf } from "obsidian";
import ChatComponent from "./ChatComponent.svelte";
import type LlmChat from "./llm_chat";

export const ChatViewType = "ChatView;";
export default class ChatView extends ItemView {
	component: ChatComponent | null = null;
	llmChat: LlmChat;

	constructor(leaf: WorkspaceLeaf, llmChat: LlmChat) {
		super(leaf);
		this.llmChat = llmChat;
	}

	getViewType(): string {
		return ChatViewType;
	}

	getDisplayText(): string {
		return "Testing";
	}

	async onOpen() {
		this.component = new ChatComponent({
			target: this.contentEl,
			props: {
				llmChat: this.llmChat,
			},
		});
	}

	async onClose() {
		if (!this.component) return;

		this.component!.$destroy();
	}
}
