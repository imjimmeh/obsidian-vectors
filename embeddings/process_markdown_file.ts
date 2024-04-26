import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { TFile, Vault } from "obsidian";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { formatDocumentsAsString } from "langchain/util/document";
import { PromptTemplate } from "@langchain/core/prompts";
import {
	RunnableSequence,
	RunnablePassthrough,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

let vectorStore: Chroma | null = null;

const chromaDbSettings = (vault: Vault) => ({
	url: "http://192.168.1.106:8886",
	collectionName: vault.getName(),
});

export async function* paginateFiles(files: TFile[]) {
	let index = 0;

	while (true) {
		let end: number | undefined = index + 20;
		if (end > files.length) {
			end = undefined;
		}

		const slice = files.slice(index, end);

		yield slice;

		index += 20;
	}
}

export const queryVectorStore = async (vault: Vault) => {
	const embeddings = new OllamaEmbeddings({
		baseUrl: "http://192.168.1.252:11434",
	});

	vectorStore = await Chroma.fromExistingCollection(
		embeddings,
		chromaDbSettings(vault)
	);

	const retriever = vectorStore.asRetriever();

	var chatLlm = new ChatOllama({
		baseUrl: "http://192.168.1.252:11434",
		model: "openchat",
	});

	const prompt =
		PromptTemplate.fromTemplate(`Answer the question based only on the following context:
	{context}
	
	Question: {question}`);

	const chain = RunnableSequence.from([
		{
			context: retriever.pipe(formatDocumentsAsString),
			question: new RunnablePassthrough(),
		},
		prompt,
		chatLlm,
		new StringOutputParser(),
	]);

	const result = await chain.invoke("What was Kayla's greivance about?");

	console.log(result);
};
export const initialiseVectorStore = async (files: TFile[], vault: Vault) => {
	console.log(vault.getName());
	const embeddings = new OllamaEmbeddings({
		baseUrl: "http://192.168.1.252:11434",
	});

	const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
		chunkSize: 500,
		chunkOverlap: 20,
	});

	for (const file of files) {
		console.log(`Processing ${file.name}`);
		const fileContents = await vault.cachedRead(file);
		console.log(`contents`, fileContents);
		const documents = await splitter.createDocuments([fileContents], [], {
			chunkHeader: `File name: ${file.name}`,
		});

		if (vectorStore == null) {
			console.log("Initialising DB");
			vectorStore = await Chroma.fromDocuments(
				documents,
				embeddings,
				chromaDbSettings(vault)
			);
		} else {
			console.log("adding documents");
			vectorStore.addDocuments(documents);
		}
	}
};
