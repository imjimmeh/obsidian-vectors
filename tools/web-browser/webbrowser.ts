import type { BaseLanguageModelInterface } from "@langchain/core/language_models/base";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import * as cheerio from "cheerio";
import {
	CallbackManager,
	CallbackManagerForToolRun,
} from "@langchain/core/callbacks/manager";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
	RecursiveCharacterTextSplitter,
	TextSplitter,
} from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { formatDocumentsAsString } from "langchain/util/document";
import { type BaseLangChainParams } from "@langchain/core/language_models/base";
export interface ToolParams extends BaseLangChainParams {}
import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";

export const parseInputs = (inputs: string): [string, string] => {
	const [baseUrl, task] = inputs.split(",").map((input) => {
		let t = input.trim();
		t = t.startsWith('"') ? t.slice(1) : t;
		t = t.endsWith('"') ? t.slice(0, -1) : t;
		// it likes to put / at the end of urls, wont matter for task
		t = t.endsWith("/") ? t.slice(0, -1) : t;
		return t.trim();
	});

	return [baseUrl, task];
};

export const getText = (
	html: string,
	baseUrl: string,
	summary: boolean
): string => {
	// scriptingEnabled so noscript elements are parsed
	const $ = cheerio.load(html, { scriptingEnabled: true });

	let text = "";

	// lets only get the body if its a summary, dont need to summarize header or footer etc
	const rootElement = summary ? "body " : "*";

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	$(`${rootElement}:not(style):not(script):not(svg)`).each(
		(_i, elem: any) => {
			// we dont want duplicated content as we drill down so remove children
			let content = $(elem)
				.clone()
				.children()
				.remove()
				.end()
				.text()
				.trim();
			const $el = $(elem);

			// if its an ahref, print the content and url
			let href = $el.attr("href");
			if ($el.prop("tagName")?.toLowerCase() === "a" && href) {
				if (!href.startsWith("http")) {
					try {
						href = new URL(href, baseUrl).toString();
					} catch {
						// if this fails thats fine, just no url for this
						href = "";
					}
				}

				const imgAlt = $el.find("img[alt]").attr("alt")?.trim();
				if (imgAlt) {
					content += ` ${imgAlt}`;
				}

				text += ` [${content}](${href})`;
			}
			// otherwise just print the content
			else if (content !== "") {
				text += ` ${content}`;
			}
		}
	);

	return text.trim().replace(/\n+/g, " ");
};

const getHtml = async (baseUrl: string, h: Headers) => {
	const domain = new URL(baseUrl).hostname;

	const headers = { ...h };
	// these appear to be positional, which means they have to exist in the headers passed in
	headers.Host = domain;
	headers["Alt-Used"] = domain;

	let htmlResponse;
	try {
		htmlResponse = await fetch(baseUrl, {
			headers,
		});
	} catch (e) {
		throw e;
	}

	const allowedContentTypes = [
		"text/html",
		"application/json",
		"application/xml",
		"application/javascript",
		"text/plain",
	];

	const contentType = htmlResponse.headers.get("content-type");
	const contentTypeArray = contentType?.split(";");
	if (
		contentTypeArray &&
		contentTypeArray[0] &&
		!allowedContentTypes.includes(contentTypeArray[0])
	) {
		throw new Error("returned page was not utf8");
	}
	return htmlResponse.text();
};

const DEFAULT_HEADERS = {
	Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
	"Accept-Encoding": "gzip, deflate",
	"Accept-Language": "en-US,en;q=0.5",
	"Alt-Used": "LEAVE-THIS-KEY-SET-BY-TOOL",
	Connection: "keep-alive",
	Host: "LEAVE-THIS-KEY-SET-BY-TOOL",
	Referer: "https://www.google.com/",
	"Sec-Fetch-Dest": "document",
	"Sec-Fetch-Mode": "navigate",
	"Sec-Fetch-Site": "cross-site",
	"Upgrade-Insecure-Requests": "1",
	"User-Agent":
		"Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/111.0",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Headers = Record<string, any>;

/**
 * Defines the arguments that can be passed to the WebBrowser constructor.
 * It extends the ToolParams interface and includes properties for a
 * language model, embeddings, HTTP headers, an Axios configuration, a
 * callback manager, and a text splitter.
 */
export interface WebBrowserArgs extends ToolParams {
	model: BaseLanguageModelInterface;

	embeddings: EmbeddingsInterface;

	headers?: Headers;

	/** @deprecated */
	callbackManager?: CallbackManager;

	textSplitter?: TextSplitter;
}

/**
 * A class designed to interact with web pages, either to extract
 * information from them or to summarize their content. It uses the axios
 * library to send HTTP requests and the cheerio library to parse the
 * returned HTML.
 * @example
 * ```typescript
 * const browser = new WebBrowser({
 *   model: new ChatOpenAI({ temperature: 0 }),
 *   embeddings: new OpenAIEmbeddings({}),
 * });
 * const result = await browser.invoke("https:exampleurl.com");
 * ```
 */
export class WebBrowser {
	static lc_name() {
		return "WebBrowser";
	}

	get lc_namespace() {
		return ["webbrowser"];
	}

	private model: BaseLanguageModelInterface;

	private embeddings: EmbeddingsInterface;

	private headers: Headers;

	private textSplitter: TextSplitter;

	constructor({ model, headers, embeddings, textSplitter }: WebBrowserArgs) {
		this.model = model;
		this.embeddings = embeddings;
		this.headers = headers ?? DEFAULT_HEADERS;
		this.textSplitter =
			textSplitter ??
			new RecursiveCharacterTextSplitter({
				chunkSize: 2000,
				chunkOverlap: 200,
			});
	}

	/** @ignore */
	async _call(
		url: string,
		task?: string,
		runManager?: CallbackManagerForToolRun
	) {
    task = !task || task.trim() == "summary" ? "create a summary" : task;
		const doSummary = !task || task.trim() == "summary";

		let text;

		try {
			const html = await getHtml(url, this.headers);
			text = getText(html, url, doSummary);
		} catch (e) {
			if (e) {
				return e.toString();
			}
			return "There was a problem connecting to the site";
		}

		const texts = await this.textSplitter.splitText(text);

		let context;
		const docs = texts.map(
			(pageContent) =>
				new Document({
					pageContent,
					metadata: [],
				})
		);

		const vectorStore = await MemoryVectorStore.fromDocuments(
			docs,
			this.embeddings
		);
		const results = await vectorStore.similaritySearch(
			task,
			10,
			undefined,
			runManager?.getChild("vectorstore")
		);
		context = formatDocumentsAsString(results);

		const input = `Using the text below, you need to:
    1. ${task}
    2. Provide up to 5 markdown links from within that would be of interest (always including URL and text). Links should be provided, if present, in markdown syntax as a list under the heading "Relevant Links:".
    =====
    Text:
    ${context};
    `;

		const chain = RunnableSequence.from([
			this.model,
			new StringOutputParser(),
		]);
		return chain.invoke(input, runManager?.getChild());
	}

	name = "web-browser";

	description = `useful for when you need to find something on or summarize a webpage.`;
}

export const createWebBrowser = ({
	model,
	headers,
	embeddings,
	textSplitter,
}: WebBrowserArgs) => {
	const browser = new WebBrowser({
		model,
		headers,
		embeddings,
		textSplitter,
	});

	const webBrowserStructuredTool = new DynamicStructuredTool({
		name: "web-browser",
		description: "navigates to a URL and retrieves a summary or data",
		schema: z.object({
			url: z.string().describe("The URL to navigate to"),
			task: z
				.string()
				.optional()
				.describe("What to retrieve from the URL, e.g. summary"),
		}),
		func: async ({ url, task }) => {
			return await browser._call(url, task);
		},
	});

	return webBrowserStructuredTool;
};
