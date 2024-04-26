import { Document } from "@langchain/core/documents";
import { Vault } from "obsidian";
import VectorDb from "./vector_store";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Embeddings } from "@langchain/core/embeddings";
import { VectorDbSettings } from "settings/types";

export default class ChromaStore extends VectorDb {

    constructor({ embeddings, vault, settings }: { embeddings: Embeddings, vault: Vault, settings: VectorDbSettings }) {
        super({ embeddings, vault, settings });
        console.log("Initialised ChromaDb");
    }
    
    initialiseDb(): void {
        this._db = new Chroma(this._embeddings, {
            url: this._settings.base_url,
            collectionName: this._vault.getName(),
        });
    }

    addDocuments({ documents }: { documents: Document<Record<string, any>>[]; }): Promise<void | string[]> {
        return this._db.addDocuments(documents);
    }

    deleteDocuments({ filePaths }: { filePaths: string[]; }): Promise<void> {
       return this._db.delete({ filePath: { $in: filePaths } } );
    }
}