<script lang="ts">
	import type { AIMessage, Message } from "./types";
	import MessageSources from "./MessageSources.svelte";
	import ChatMessageBox from "./ChatMessageBox.svelte";
	import { onMount } from "svelte";
	import ChatView from "./chat_view";

	export let message: Message;
	export let chatView: ChatView;

	$: aiMessage = message.sender == "AI" ? (message as AIMessage) : null;

	let messageContainerElement: HTMLElement;

	onMount(() => {
		chatView.renderMessage(message.message, messageContainerElement);
	});
</script>

<ChatMessageBox sender={message.sender}>
	<div class="message-text" bind:this={messageContainerElement}></div>

	{#if aiMessage}
		<MessageSources message={aiMessage} />
	{/if}
</ChatMessageBox>
