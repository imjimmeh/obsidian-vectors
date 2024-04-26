import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { LanceDB } from "@langchain/community/vectorstores/lancedb";
import * as path from "path";
import * as fs from "fs";
import { connect } from "vectordb";
import { TFile } from "obsidian";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import MarkdownLoader from "./markdown_loader";

let vectorStore: LanceDB | null = null;

const fileLoader = (vaultPath: string) => {
    const dirLoader = new DirectoryLoader(vaultPath, {
    ".md": (path) => new MarkdownLoader(path)
});

    return dirLoader;
}

export async function* paginateFiles(files: TFile[]){
    let index = 0;

    while(true){
        let end: number | undefined = index + 20;
        if(end > files.length){
            end = undefined;
        }

        const slice = files.slice(index, end);

        yield slice;

        index += 20;
    }
}

export const initialiseVectorStore = async (vaultPath: string) => {
    const table = await initialiseDb();
  
    const documentLoader = fileLoader(vaultPath);
    
    const documents = await documentLoader.load();
    vectorStore = await LanceDB.fromDocuments(documents, new OllamaEmbeddings(), {table});

};

async function initialiseDb() {
    const dir = "lancedb";
    if(!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    const db = await connect(dir);
    const table = await db.createTable("vectors", [
        { vector: Array(1536), text: "sample", id: 1 },
    ]);
    
    return table;
}
