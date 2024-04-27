import { TFile } from "obsidian";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import ObsidianVectorPlugin from "vector_plugin";
import Notifications from "../obsidian/notifications";

//TODO: Make abstract class
//THINK: Should this be a child of the vector store, or something else?
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

		//TODO: Consider just adding all the files into the "upadedFiles" field (and renaming that),
		//That way, that can just be _the thing_ that does the updates/adding/etc
		//... Maybe deletes as well? Make it contain objects with a file status?
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

		this.notifications.hide();
	}

	async deleteFile(filePath: string) {
		this.plugin.vectorStore.deleteDocumentsForFile({ filePath: filePath });
	}

	async addFile(file: TFile, notificationMessage?: string) {
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

		await this.plugin.vectorStore.addDocuments({
			documents: documents,
			ids: ids,
		});

		console.log(`Embedded documents for ${file.name}`);
	}

	private createMetadata(file: TFile): Record<string, any>[] | undefined {
		return [{ fileName: file.name, filePath: file.path }];
	}
}
