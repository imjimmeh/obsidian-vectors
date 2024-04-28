<script lang="ts">
	import type { AIMessage, Message } from "./types";
	import MessageSources from "./MessageSources.svelte";
	import ChatMessageBox from "./ChatMessageBox.svelte";
	export let message: Message;

	$: aiMessage = message.sender == "AI" ? (message as AIMessage) : null;
</script>

<ChatMessageBox sender={message.sender}>
	<span class="message-text">{message.message}</span>

	{#if aiMessage}
		<MessageSources message={aiMessage} />
	{/if}
</ChatMessageBox>
