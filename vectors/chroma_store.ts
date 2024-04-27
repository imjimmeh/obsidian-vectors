import { Document } from "@langchain/core/documents";
import { Vault } from "obsidian";
import VectorDb from "./vector_store";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Embeddings } from "@langchain/core/embeddings";
import { VectorDbSettings } from "settings/types";
import { ChromaClient, Collection } from "chromadb";

export default class ChromaStore extends VectorDb {
	collection: Collection;
	client: ChromaClient;

	constructor({
		embeddings,
		vault,
		settings,
	}: {
		embeddings: Embeddings;
		vault: Vault;
		settings: VectorDbSettings;
	}) {
		super({ embeddings, vault, settings });
	}

	async initialiseDb(): Promise<void> {
		this.client = new ChromaClient({ path: this._settings.base_url });
		//TODO: remove this once tested
		this.client.deleteCollection({ name: this._vault.getName() });
		this.collection = await this.client.getOrCreateCollection({
			name: this._vault.getName(),
		});

		this._db = new Chroma(this._embeddings, {
			collectionName: this._vault.getName(),
			index: this.client,
		});
	}

	addDocuments({
		documents,
		filePath,
		fileName,
		ids,
	}: {
		documents: Document<Record<string, any>>[];
		filePath: string;
		fileName: string;
		ids?: string[] | null;
	}): Promise<void | string[]> {
		return this._db.addDocuments(documents, {
			ids: ids,
			metadata: { fileName: fileName, filePath: filePath },
		});
	}

	async deleteDocumentsForFile({
		filePath,
	}: {
		filePath: string;
	}): Promise<void> {
		console.log("Deleting embeddings for " + filePath);

		const result = await this.collection.delete({
			where: { filePath: { $eq: filePath } },
		});

		console.log("Deletion result", result);

		return;
	}
}
