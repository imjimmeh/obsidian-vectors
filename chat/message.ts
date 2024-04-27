export interface Message {
	sender: "AI" | "User";
	message: string;
}

export interface AIMessage extends Message {
	sender: "AI";
	sources: string[];
}
