import { Notice } from "obsidian";

export default class Notifications {
	message: string = "";
	notice?: Notice | null = null;
	logMessages: boolean = true;

	displayMessage(message: string) {
		this.message = message;

		if (!this.notice) {
			this.notice = new Notice(message, 0);
		} else {
			this.notice.setMessage(message);
		}

		if (this.logMessages) {
			console.log(message);
		}
	}

	hide() {
		this.notice?.hide();
	}
}
