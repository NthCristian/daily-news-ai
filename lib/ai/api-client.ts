import OpenAI from "openai";
import { AiConfig } from "./config";

export class ApiClient {
    private client: OpenAI;

    constructor(client?: OpenAI) {
        this.client =
            client ??
            new OpenAI({
                baseURL: AiConfig.baseURL,
                apiKey: AiConfig.apiKey,
            });
    }

    /**
     * Sends a chat completion request and returns the parsed JSON result.
     * Throws if the response is empty or cannot be parsed.
     */
    async complete<T>(systemPrompt: string, userContent: string): Promise<T> {
        const response = await this.client.chat.completions.create({
            model: AiConfig.modelName,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userContent },
            ],
            response_format: { type: "json_object" },
        });

        const result = response.choices[0]?.message?.content;
        if (!result) {
            throw new Error("No response from API");
        }

        return JSON.parse(result) as T;
    }
}
