<script lang="ts">
	import type LlmChat from "./llm_chat";
	import type { Message, AIMessage } from "./message";
	import ChatMessage from "./ChatMessage.svelte";
	let messages: Message[] = [];
	$: messages = [];

	export let llmChat: LlmChat;

	const postMessage = async () => {
		const message = `${userMessage}`;
		userMessage = "";

		addMessage({ sender: "User", message: message });

		const response = await llmChat.sendMessage(message);

		addMessage(response);
	};

	const addMessage = (message: Message) => {
		messages = [...messages, message];
	};

	const onTextAreaKeyPress = async (event: KeyboardEvent) => {
		//Send message on shift + enter press
		if (event.code == "Enter" && event.shiftKey) {
			await postMessage();
		}
	};

	let userMessage: string = "";
</script>

<h2>Chat</h2>

<div class="messages">
	{#each messages as message}
		<ChatMessage {message} />
	{/each}
</div>
<div class="input-form">
	<textarea
		class="message-box"
		bind:value={userMessage}
		on:keypress={onTextAreaKeyPress}
	/>
	<div id="btn-container">
		<button on:click={postMessage} id="send-message-btn">Send</button>
	</div>
</div>

<style>
	div.messages {
		height: 80%;
		overflow-y: scroll;
	}

	div.input-form {
		height: 20%;
		display: flex;
		flex-direction: column;
	}

	.message-box {
		width: 100%;
		resize: none;
		height: 80%;
	}

	#btn-container {
		margin-top: 5px;
		display: flex;
		justify-content: end;
	}

	#send-message-btn {
		width: 50%;
	}
</style>
