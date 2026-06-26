import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { TelegramConfig } from "./config";
import type { SubscriptionList } from "./types";

export class SubscriptionManager {
    private filePath: string;

    constructor(filePath?: string) {
        this.filePath = filePath ?? TelegramConfig.subscriptionListPath;
    }

    /**
     * Reads the subscription list from disk.
     * Returns an empty list if the file does not exist.
     */
    private read(): SubscriptionList {
        if (!existsSync(this.filePath)) {
            return { subscribers: [] };
        }

        const raw = readFileSync(this.filePath, "utf-8");
        try {
            const parsed = JSON.parse(raw);
            return {
                subscribers: Array.isArray(parsed.subscribers)
                    ? parsed.subscribers
                    : [],
            };
        } catch {
            return { subscribers: [] };
        }
    }

    /** Persists the subscription list to disk. */
    private write(list: SubscriptionList): void {
        writeFileSync(this.filePath, JSON.stringify(list, null, 2), "utf-8");
    }

    /** Subscribes a user by Telegram user ID. Returns true if newly added. */
    subscribeUser(userId: number): boolean {
        const list = this.read();
        if (list.subscribers.includes(userId)) {
            return false;
        }
        list.subscribers.push(userId);
        this.write(list);
        return true;
    }

    /** Unsubscribes a user by Telegram user ID. Returns true if removed. */
    unsubscribeUser(userId: number): boolean {
        const list = this.read();
        const index = list.subscribers.indexOf(userId);
        if (index === -1) {
            return false;
        }
        list.subscribers.splice(index, 1);
        this.write(list);
        return true;
    }

    /** Returns all subscribed user IDs. */
    getSubscribers(): number[] {
        return this.read().subscribers;
    }
}
