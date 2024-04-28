<script lang="ts">
	import type { MessageSender } from "./types";

	export let sender: MessageSender;
</script>

<div
	class="chat-message"
	class:ai-message={sender == "AI"}
	class:user-message={sender == "User"}
>
	<slot />
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
