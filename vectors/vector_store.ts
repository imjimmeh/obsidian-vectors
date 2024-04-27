import { VectorStore } from "@langchain/core/vectorstores";
import { Vault } from "obsidian";
import { Document } from "@langchain/core/documents";
import { Embeddings } from "@langchain/core/embeddings";
import { VectorDbSettings } from "settings/types";

export default abstract class VectorDb {
	_db: VectorStore;
	_embeddings: Embeddings;
	_vault: Vault;
	_settings: VectorDbSettings;

	constructor({
		embeddings,
		vault,
		settings,
	}: {
		vault: Vault;
		settings: VectorDbSettings;
		embeddings: Embeddings;
	}) {
		this._embeddings = embeddings;
		this._vault = vault;
		this._settings = settings;
	}

	abstract initialiseDb(): Promise<void>;

	abstract addDocuments({
		documents,
		ids,
	}: {
		documents: Document[];
		ids?: string[] | undefined;
	}): Promise<void | string[]>;

	abstract deleteDocuments({
		filePaths,
	}: {
		filePaths: string[];
	}): Promise<void>;
}
