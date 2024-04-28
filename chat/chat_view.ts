import {
	App,
	Component,
	ItemView,
	View,
	WorkspaceLeaf,
	MarkdownRenderer,
} from "obsidian";
import ChatComponent from "./ChatComponent.svelte";
import type LlmChat from "../llm/llm_chat";
export const ChatViewType = "ChatView;";

export default class ChatView extends ItemView {
	chatComponent: ChatComponent | null = null;
	llmChat: LlmChat;
	app: App;

	constructor(app: App, leaf: WorkspaceLeaf, llmChat: LlmChat) {
		super(leaf);
		this.app = app;
		this.llmChat = llmChat;
	}

	getViewType(): string {
		return ChatViewType;
	}

	getDisplayText(): string {
		return "AI Chat";
	}

	getIcon(): string {
		return "message-circle";
	}
	async onOpen() {
		this.chatComponent = new ChatComponent({
			target: this.contentEl,
			props: {
				llmChat: this.llmChat,
				chatView: this,
			},
		});
	}

	async onClose() {
		if (!this.chatComponent) return;

		this.chatComponent!.$destroy();
	}

	renderMessage(message: string, container: HTMLElement): Promise<void> {
		return MarkdownRenderer.render(
			this.app,
			message,
			container,
			"/ai_message_temp.md",
			this
		);
	}
}
