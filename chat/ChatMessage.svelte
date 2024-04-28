<script lang="ts">
	import type { AIMessage, Message } from "./message";
	import MessageSources from "./MessageSources.svelte";
	export let message: Message;

	$: aiMessage = message.sender == "AI" ? (message as AIMessage) : null;
</script>

<div
	class="chat-message"
	class:ai-message={message.sender == "AI"}
	class:user-message={message.sender == "User"}
>
	<span class="message-text">{message.message}</span>

	{#if aiMessage}
		<MessageSources message={aiMessage} />
	{/if}
</div>

<style>
	.chat-message {
		width: 80%;
		color: white;
		border-radius: 15px;
		padding: 4% 6%;
		margin-top: 10px;
		border-width: 1px;
		border-color: black;
	}

	.ai-message {
		background-color: #444;
	}

	.user-message {
		background-color: cornflowerblue;
		margin-left: 20%;
	}
</style>
