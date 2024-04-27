import { ItemView, View, WorkspaceLeaf } from "obsidian";

export const ChatViewType = "ChatView;";
export default class ChatView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return ChatViewType;
	}

	getDisplayText(): string {
		return "Testing";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.createEl("h4", { text: "Example view" });

		container.createEl("input", { type: "text" });
	}

	async onClose() {
		// Nothing to clean up.
	}
}
