export interface Message {
	sender: MessageSender;
	message: string;
}

export interface AIMessage extends Message {
	sender: "AI";
	sources: string[];
}

export type MessageSender = "AI" | "User";
