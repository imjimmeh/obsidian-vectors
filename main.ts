import ObsidianVectorPlugin from "vector_plugin";

import { runAgent } from "agents/ollama-agent";

runAgent().then(() => console.log("done!"));
