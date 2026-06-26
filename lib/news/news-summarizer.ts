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

        const systemPrompt = `You are a news summarizer. Parse the provided RSS feed XML content, extract relevant distinct news items (articles), write a concise 1-3 sentence summary in Portuguese for each, and categorize them.

Return a JSON object with the following structure:
{
  "categories": {
    "CategoryName": [
      {
        "title": "Article title in Portuguese",
        "summary": "1-3 sentence summary",
        "publisher": "Name of the responsible for the article",
        "source": "Article URL",
      }
    ]
  }
}

You must write the article title and summary to Portuguese.
Possible categories are Technology, Politics, Brazil's Technology and Brazil's Politics
Only include actual news articles — skip feed metadata, navigation links, and non-news items.`;

        const parsed = await this.client.complete<{
            categories?: SummarizedNews;
        }>(systemPrompt, combinedContent);

        return parsed.categories ?? (parsed as unknown as SummarizedNews);
    }
}
