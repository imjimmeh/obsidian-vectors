<script lang="ts">
	import type { MessageOptions } from "./types";

	export let sendMessage: (
		userMessage: string,
		options: MessageOptions,
	) => Promise<void>;

	let userMessage: string = "";

	let options: MessageOptions = {
		useRag: true,
	};

	const onTextAreaKeyPress = async (event: KeyboardEvent) => {
		//Send message on shift + enter press
		if (event.code == "Enter" && event.shiftKey) {
			await sendMessageAndClearChat();
		}
	};

	const sendMessageAndClearChat = async () => {
		const promise = sendMessage(userMessage, options);

		userMessage = "";

		await promise;
	};
</script>

<div class="user-input">
	<textarea
		class="message-box"
		bind:value={userMessage}
		on:keypress={onTextAreaKeyPress}
	/>
	<div id="btn-container">
		<label>
			Enable RAG
			<input type="checkbox" id="use-rag" bind:checked={options.useRag} />
		</label>
		<button on:click={sendMessageAndClearChat} id="send-message-btn"
			>Send</button
		>
	</div>
</div>

<style>
	div.user-input {
		display: flex;
		flex-direction: column;
		height: 100%;
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
