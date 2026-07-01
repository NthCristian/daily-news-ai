import { ApiClient } from "../ai/api-client";
import { NewsConfig } from "./config";
import type { SummarizedNews } from "./types";

export class NewsSummarizer {
    private client: ApiClient;

    constructor(client?: ApiClient) {
        this.client = client ?? new ApiClient();
    }

    /** Combines raw feed XML, sends to LLM, and returns categorized summaries */
    async summarize(feeds: string[]): Promise<SummarizedNews> {
        const combinedContent = feeds
            .map((xml, i) => {
                const truncated =
                    xml.length > NewsConfig.maxFeedChars
                        ? xml.substring(0, NewsConfig.maxFeedChars)
                        : xml;
                return `<feed index="${i}">\n${truncated}\n</feed>`;
            })
            .join("\n");

        const systemPrompt = `You are an expert multilingual news analyst and data structuring assistant. Your objective is to parse raw RSS feed XML content, extract distinct news articles, summarize them, and output the data strictly as a JSON object.

Step-by-Step Instructions

1. Extraction & Filtering: Analyze the provided XML content to identify distinct news articles. You must strictly skip and ignore all feed metadata, navigation links, advertisements, and non-news items.

2. Translation & Summarization: For each valid article:

    - Translate the original title into clear, accurate Portuguese.

    - Write a concise, comprehensive summary of exactly 1 to 3 sentences in Portuguese.

3. Categorization: Evaluate the content of each article and classify it into one of the following exact categories:

    - Tecnologia no Mundo

    - Política no Mundo

    - Tecnologia no Brasil

    - Política no Brasil
(Note: Do not create any new categories. If an article strictly does not fit any of these four, discard it.)

4. Attribution: Identify the publisher (the name of the entity or author responsible for the article) and extract the direct source (the article's URL).

Output Format
Return ONLY a valid JSON object using the exact schema provided below. Do not include any conversational filler, introductory text, or markdown blocks outside of the JSON itself.

JSON
{
  "categories": {
    "CategoryName": [
      {
        "title": "Article title translated to Portuguese",
        "summary": "1-3 sentence summary in Portuguese",
        "publisher": "Name of the publisher or author",
        "source": "Direct URL to the article"
      }
    ]
  }
}`;

        const parsed = await this.client.complete<{
            categories?: SummarizedNews;
        }>(systemPrompt, combinedContent);

        return parsed.categories ?? (parsed as unknown as SummarizedNews);
    }
}
