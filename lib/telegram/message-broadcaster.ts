import { SubscriptionManager } from "./subscription-manager";
import { TelegramConfig } from "./config";

export class MessageBroadcaster {
    private subscriptions: SubscriptionManager;

    constructor(subscriptions?: SubscriptionManager) {
        this.subscriptions = subscriptions ?? new SubscriptionManager();
    }

    /**
     * Sends one or more messages to every subscribed Telegram user.
     * Uses the Bot API sendMessage endpoint with HTML parse mode.
     * Messages are sent sequentially with a small delay between them.
     * Returns the list of user IDs that received ALL messages successfully.
     */
    async broadcast(messages: string[]): Promise<number[]> {
        const token = TelegramConfig.botToken;
        if (!token) {
            throw new Error(
                "Cannot broadcast: TELEGRAM_BOT_TOKEN is not set in environment variables.",
            );
        }

        const subscribers = this.subscriptions.getSubscribers();
        if (subscribers.length === 0) {
            console.warn("No subscribers to broadcast to.");
            return [];
        }

        const successful: number[] = [];

        for (const userId of subscribers) {
            const allDelivered = await this.sendMessages(
                token,
                userId,
                messages,
            );
            if (allDelivered) {
                successful.push(userId);
            }
        }

        console.info(
            `Broadcast complete: ${successful.length}/${subscribers.length} delivered (${messages.length} messages each).`,
        );

        return successful;
    }

    /** Sends all messages to a single user. Returns true if all succeeded. */
    private async sendMessages(
        token: string,
        userId: number,
        messages: string[],
    ): Promise<boolean> {
        for (let i = 0; i < messages.length; i++) {
            try {
                const res = await fetch(
                    `https://api.telegram.org/bot${token}/sendMessage`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            chat_id: userId,
                            text: messages[i],
                            parse_mode: "HTML",
                        }),
                    },
                );

                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    console.error(
                        `Failed to send message ${i + 1}/${messages.length} to user ${userId}:`,
                        err ?? res.statusText,
                    );
                    return false;
                }

                // Small delay to avoid hitting rate limits
                if (i < messages.length - 1) {
                    await new Promise((r) => setTimeout(r, 200));
                }
            } catch (e) {
                console.error(
                    `Error sending message ${i + 1}/${messages.length} to user ${userId}:`,
                    e,
                );
                return false;
            }
        }

        return true;
    }
}
