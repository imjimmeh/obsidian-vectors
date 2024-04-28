<script lang="ts">
	import type LlmChat from "../llm/llm_chat";
	import type { Message, MessageOptions } from "./types";
	import ChatMessage from "./ChatMessage.svelte";
	import AiMessagePlaceholder from "./AIMessagePlaceholder.svelte";
	import UserInput from "./UserInput.svelte";
	import ChatView from "./chat_view";

	let messages: Message[] = [];
	$: messages = [];

	export let llmChat: LlmChat;
	export let chatView: ChatView;

	$: awaitingResponse = false;

	const sendMessage = async (
		userMessage: string,
		options: MessageOptions,
	) => {
		addMessage({ sender: "User", message: userMessage });

		const responsePromise = llmChat.sendMessage(userMessage, options);

		awaitingResponse = true;

		const response = await responsePromise;

		addMessage(response);

		awaitingResponse = false;
	};

	const addMessage = (message: Message) => {
		messages = [...messages, message];
	};
</script>

<div id="ai-chat-container">
	<h2>Chat</h2>

	<div id="container">
		<div class="messages">
			{#each messages as message}
				<ChatMessage {message} {chatView} />
			{/each}

			{#if awaitingResponse}
				<AiMessagePlaceholder />
			{/if}
		</div>

		<div id="input">
			<UserInput {sendMessage} />
		</div>
	</div>
</div>

<style>
	.messages {
		height: 60%;
		overflow-y: scroll;
	}

	#ai-chat-container {
		height: 95%;
	}

	#container {
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	#input {
		height: 30%;
		margin-bottom: 10px;
	}
</style>
