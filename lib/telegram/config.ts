export const TelegramConfig = {
    get botToken(): string | undefined {
        return process.env.TELEGRAM_BOT_TOKEN;
    },

    get subscriptionListPath(): string {
        return "./subscription.json";
    },
} as const;
