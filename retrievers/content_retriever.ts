import { ParentDocumentRetriever } from "langchain/retrievers/parent_document";
import { MultiQueryRetriever } from "langchain/retrievers/multi_query";
import { ScoreThresholdRetriever } from "langchain/retrievers/score_threshold";
import LlmChat from "chat/llm_chat";
import { VectorStore } from "@langchain/core/vectorstores";
import { PromptTemplate } from "@langchain/core/prompts";
export default class ContentRetiever<TVectorStore extends VectorStore> {
	//  private parentDocumentRetriever: ParentDocumentRetriever;
	private vectorStore: TVectorStore;
	private similarityScoreRetriever: ScoreThresholdRetriever<TVectorStore>;
	private multiQueryRetriever: MultiQueryRetriever;

	constructor(vectorStore: TVectorStore, llm: LlmChat) {
		this.vectorStore = vectorStore;
		this.similarityScoreRetriever = new ScoreThresholdRetriever({
			minSimilarityScore: 0.65,
			maxK: 100,
			kIncrement: 2,
			vectorStore: vectorStore,
		});

		const template = `You are an AI designed to help users answer queries.
	You have access to a vector database, which contains all of the user's notes.
	
	Your task is to extract at least {queryCount} key words/phrases, or synonyms, from the user's query.

	By generating multiple perspectives on the user question, your goal is to help the user overcome some of the limitations of distance-based similarity search.
	Given their query below, try to break down their query into smaller components, so that you can find the right information from their notes for their query.

	Do not assume what the things they are referring to are, unless it is obvious. E.g. if they use a name, or an unknown acronym, do not assume you know what this means without querying their data.
	Do not respond with anything other than the new queries. Do not respond with any other information, thoughts, explanations etc.; just respond with the new texts to query.
	
	Provide these key words separated by newlines between XML tags. For example:

	<questions>
	Word
	Phrase 
	Word
	</questions>

	Eexamples:

	User: "Where does Bob live?"

	AI:
	<questions>
	Bob
	Live
	Home
	House
	</questions>

	User: "What are the user stories for project Cool Development Project?"

	AI:
	<questions>
	User Stories
	Tasks
	Development
	Project
	Cool Development Project
	</questions>
	---

	Query:
	{question}`;

		const promptTemplate = PromptTemplate.fromTemplate(template);

		this.multiQueryRetriever = MultiQueryRetriever.fromLLM({
			llm: llm.llm,
			retriever: this.similarityScoreRetriever,
			verbose: true,
			prompt: promptTemplate,
			queryCount: 5,
		});
	}

	invoke(input: string) {
		return this.multiQueryRetriever.invoke(input);
	}
}
