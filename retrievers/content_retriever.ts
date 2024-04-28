import { ParentDocumentRetriever } from "langchain/retrievers/parent_document";
import VectorDb from "vectors/vector_store";
import { MultiQueryRetriever} from "langchain/retrievers/multi_query"
import { ScoreThresholdRetriever } from "langchain/retrievers/score_threshold";
import LlmChat from "chat/llm_chat";
import type { Chroma } from "@langchain/community/vectorstores/chroma";
import { VectorStore } from "@langchain/core/vectorstores";

export default class ContentRetiever<TVectorStore extends VectorStore>{

  //  private parentDocumentRetriever: ParentDocumentRetriever;
    private vectorStore: TVectorStore;
    private similarityScoreRetriever: ScoreThresholdRetriever<TVectorStore>;
    private multiQueryRetriever: MultiQueryRetriever;

    constructor(vectorStore: TVectorStore, llm: LlmChat) {
        this.vectorStore = vectorStore;
        this.similarityScoreRetriever = new ScoreThresholdRetriever({
            minSimilarityScore: 0.7,
            maxK: 100,
            kIncrement: 4,
            vectorStore: vectorStore
        });

        this.multiQueryRetriever = MultiQueryRetriever.fromLLM({
            llm: llm.llm,
            retriever: this.similarityScoreRetriever,
            verbose: true
        });
    }

    invoke(input: string){
        return  this.multiQueryRetriever.invoke(input);
    }
}