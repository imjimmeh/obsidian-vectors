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

	updatedFiles: TFile[] = [];
	initialisingCollection = false;

	plugin: ObsidianVectorPlugin;

	constructor({ plugin }: { plugin: ObsidianVectorPlugin }) {
		this.plugin = plugin;
	}

	async addAllDocumentsToVectorStore() {
		this.initialisingCollection = true;
		const files = this.plugin.app.vault.getMarkdownFiles();

		this.notifications.displayMessage("Processing files...");

		for (let x = 0; x < files.length; x++) {
			const file = files[x];
			await this.addFile(
				file,
				`Embedding documents.\n\nProcessing ${x}/${files.length}: ${file.name}`
			);
		}

		this.notifications.hide();
		this.initialisingCollection = false;
	}

	async updateFile(file: TFile) {
		//TODO: Don't do updates right away, as there'll be loads with repeated savings.
		this.updatedFiles.push(file);

		if (this.initialisingCollection) {
			return;
		}

		const filesToUpdate = [...this.updatedFiles];

		this.updatedFiles = [];

		for (const file of filesToUpdate) {
			this.addFile(file);
		}
	}

	private async addFile(file: TFile, notificationMessage?: string) {
		this.notifications.displayMessage(
			notificationMessage ??
				`Embedding documents.\n\Processing: ${file.name}`
		);

		const fileContents = await this.plugin.app.vault.cachedRead(file);

		const documents = await this._splitter.createDocuments(
			[fileContents],
			this.createMetadata(file)
		);

		const ids = documents.map((_, index) => `${file.name}_${index}`);

		await this.plugin.vectorStore.addDocuments({ documents, ids });
	}

	private createMetadata(file: TFile): Record<string, any>[] | undefined {
		return [{ fileName: file.name, filePath: file.path }];
	}
}
