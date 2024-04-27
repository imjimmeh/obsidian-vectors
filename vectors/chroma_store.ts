import { Document } from "@langchain/core/documents";
import { Vault } from "obsidian";
import VectorDb from "./vector_store";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Embeddings } from "@langchain/core/embeddings";
import { VectorDbSettings } from "settings/types";
import { ChromaClient, Collection, IEmbeddingFunction } from "chromadb";

export default class ChromaStore
	extends VectorDb
	implements IEmbeddingFunction
{
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
		//this.client.deleteCollection({ name: this._vault.getName() });

		this.collection = await this.client.getOrCreateCollection({
			name: this._vault.getName(),
			embeddingFunction: this,
		});

		this._db = new Chroma(this._embeddings, {
			collectionName: this._vault.getName(),
			index: this.client,
		});
	}

	async generate(text: string[]): Promise<number[][]> {
		return this._embeddings.embedDocuments(text);
	}

	addDocuments({
		documents,
		ids,
	}: {
		documents: Document<Record<string, any>>[];
		ids?: string[] | null;
	}): Promise<void | string[]> {
		return this._db.addDocuments(documents, {
			ids: ids,
		});
	}

	deleteDocumentsForFile({ filePath }: { filePath: string }): Promise<void> {
		const whereClaus = this.filterByFilePath(filePath);

		return this._db.delete(this.filterByFilePath(filePath));
	}

	private filterByFilePath(filePath: string) {
		return {
			where: { filePath: filePath },
		};
	}
}
