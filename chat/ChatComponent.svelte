<script lang="ts">
	import type LlmChat from "./llm_chat";
	import type { Message } from "./message";

	let messages: Message[] = [];
	$: messages = [];

	export let llmChat: LlmChat;

	const postMessage = async () => {
		const message = `${userMessage}`;
		userMessage = "";

		addMessage({ sender: "User", message: message });
		const response = await llmChat.sendMessage(message);

		addMessage({ sender: "AI", message: response });
	};

	const addMessage = (message: Message) => {
		messages = [...messages, message];
	};

	let userMessage: string = "";
</script>

<h2>Chat</h2>

<div>
	{#each messages as message}
		<div>
			<p>{message.sender}</p>
			<p>{message.message}</p>
		</div>
	{/each}
</div>
<div>
	<input type="text" bind:value={userMessage} />
	<button on:click={postMessage} />
</div>
