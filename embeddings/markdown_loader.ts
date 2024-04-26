import { BaseDocumentLoader } from "langchain/document_loaders/base";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import * as fs from "fs";
import { Document } from "@langchain/core/documents";
export default class MarkdownLoader extends BaseDocumentLoader {
	filePath: string = "";
	constructor(filePath: string) {
		super();
		this.filePath = filePath;
	}

	splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
		chunkSize: 500,
		chunkOverlap: 0,
	});

	override load(): Promise<Document[]> {
		const contents = fs.readFileSync(this.filePath, "utf8");
		return this.splitter.createDocuments([contents], [], {
			chunkHeader: `Document Name: ${this.filePath}`,
		});
	}
}
