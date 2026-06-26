export const AiConfig = {
    get modelName(): string {
        const model = process.env.MODEL_NAME;
        if (!model) {
            throw new Error(
                "Cannot make API request because MODEL_NAME is not set in environment variables.",
            );
        }
        return model;
    },

    get baseURL(): string | undefined {
        return process.env.BASE_URL;
    },

    get apiKey(): string | undefined {
        return process.env.API_KEY;
    },
} as const;
