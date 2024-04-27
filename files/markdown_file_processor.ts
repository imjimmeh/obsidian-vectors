import { TFile } from "obsidian";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import ObsidianVectorPlugin from "vector_plugin";
import Notifications from "../obsidian/notifications";

export default class MarkdownFileProcessor {
	notifications = new Notifications();

	_splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
		chunkSize: 500,
		chunkOverlap: 20,
	});

	async addAllDocumentsToVectorStore(plugin: ObsidianVectorPlugin) {
		const files = plugin.app.vault.getMarkdownFiles();

		this.notifications.displayMessage("Processing files...");

		for (const file of files) {
			await this.addFile(plugin, file);
		}

		this.notifications.hide();
	}

	private async addFile(plugin: ObsidianVectorPlugin, file: TFile) {
		this.notifications.displayMessage(
			`Embedding documents.\n\nProcessing ${file.name}`
		);

		const fileContents = await plugin.app.vault.cachedRead(file);

		const documents = await this._splitter.createDocuments(
			[fileContents],
			this.createMetadata(file)
		);

		const ids = documents.map((_, index) => `${file.name}_${index}`);

		await plugin.vectorStore.addDocuments({ documents, ids });
	}

	private createMetadata(file: TFile): Record<string, any>[] | undefined {
		return [{ fileName: file.name, filePath: file.path }];
	}
}
