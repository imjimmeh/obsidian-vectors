import { DynamicStructuredTool } from "@langchain/core/tools";
import { z} from "zod";

export const queryResponse = new DynamicStructuredTool({
    name: "query-response",
    description: "Provide a response to the user's query",
    schema: z.object({
      response: z.string().describe("The final answer to the user's query"),
    }),
    func: async({ response }) => {
      return response;
    }
  });
