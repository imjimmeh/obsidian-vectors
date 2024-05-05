import { DynamicStructuredTool } from "@langchain/core/tools";
import type { ContentRetriever } from "retrievers/content_retriever";
import { z} from "zod";
import { Document } from "@langchain/core/documents";

export const createRetrieverTool = (retriever: ContentRetriever) => {
    return new DynamicStructuredTool({
        name: "retriever-tool",
        description: "retrieves information from the user's notes",
        schema: z.object({
            query: z.string().describe("The query to search for"),
        }),
        func: async ({ query }) => {
            const docs = await retriever.invoke(query);

            return  docs.map((doc: Document) => doc.pageContent).join("\n\n");
        }
    })
}

