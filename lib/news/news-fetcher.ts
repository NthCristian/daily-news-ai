import { NewsConfig } from "./config";

export class NewsFetcher {
    private providers: readonly string[];

    constructor(providers?: readonly string[]) {
        this.providers = providers ?? NewsConfig.rssProviders;
    }

    /** Fetches all RSS feeds concurrently and returns their raw XML strings */
    async fetchAll(): Promise<string[]> {
        const requests = this.providers.map(async (provider) => {
            const res = await fetch(provider);
            const text = await res.text();
            if (!text) {
                throw new Error(
                    `Could not get text from response: ${provider}`,
                );
            }
            return text;
        });

        return Promise.all(requests);
    }
}
