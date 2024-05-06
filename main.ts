import { runAgent } from "agents/ollama-agent";

runAgent("What is the website www.martynharris8.com about?").then((resp) => console.log(resp));