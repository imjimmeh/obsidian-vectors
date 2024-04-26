import { TFile } from "obsidian";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import ObsidianVectorPlugin from "vector_plugin";

export default class MarkdownFileProcessor {
	_splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
		chunkSize: 500,
		chunkOverlap: 20,
	});

	async addAllDocumentsToVectorStore(plugin: ObsidianVectorPlugin) {
		const files = plugin.app.vault.getMarkdownFiles();

		for (const file of files) {
			await this.addFile(plugin, file);
		}
	}

	private async addFile(plugin: ObsidianVectorPlugin, file: TFile) {
		console.log(`Processing ${file.name}`);

		const fileContents = await plugin.app.vault.cachedRead(file);
		const documents = await this._splitter.createDocuments(
			[fileContents],
			this.createMetadata(file)
		);
		await plugin.vectorStore.addDocuments({ documents });

		console.log(`Added documents`, documents);
	}

	private createMetadata(file: TFile): Record<string, any>[] | undefined {
		return [{ fileName: file.name, filePath: file.path }];
	}
}
