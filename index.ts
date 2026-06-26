import { NewsFetcher } from "./lib/news/news-fetcher";
import { NewsSummarizer } from "./lib/news/news-summarizer";
import { MessageFormatter } from "./lib/telegram/message-formatter";
import { MessageBroadcaster } from "./lib/telegram/message-broadcaster";
import { TelegramBot } from "./lib/telegram/bot";

const command = process.argv[2];

function printUsage(): void {
    console.log("Usage: bun index.ts <command>");
    console.log("");
    console.log("Commands:");
    console.log(
        "  bot         Start the Telegram bot to handle /subscribe and /unsubscribe",
    );
    console.log(
        "  broadcast   Fetch latest news, summarize, and broadcast to all subscribers",
    );
    console.log("");
    console.log("Environment variables required:");
    console.log("  MODEL_NAME          LLM model name");
    console.log(
        "  BASE_URL            LLM API base URL (optional, defaults to OpenAI)",
    );
    console.log("  API_KEY             LLM API key");
    console.log(
        "  TELEGRAM_BOT_TOKEN  Telegram bot token (required for bot and broadcast)",
    );
}

if (!command) {
    printUsage();
    process.exit(0);
}

switch (command.toLowerCase()) {
    case "bot": {
        const bot = new TelegramBot();

        bot.start();

        // Graceful shutdown on Ctrl+C
        process.on("SIGINT", async () => {
            console.log("\nShutting down bot...");
            await bot.stop();
            process.exit(0);
        });
        process.on("SIGTERM", async () => {
            console.log("\nShutting down bot...");
            await bot.stop();
            process.exit(0);
        });

        break;
    }

    case "broadcast": {
        // Short-circuit if there are no subscribers to avoid wasting API calls
        const { SubscriptionManager } =
            await import("./lib/telegram/subscription-manager");
        const checkSubs = new SubscriptionManager();
        const subCount = checkSubs.getSubscribers().length;
        if (subCount === 0) {
            console.log("No subscribers. Nothing to broadcast.");
            break;
        }
        console.log(`Found ${subCount} subscriber(s).`);

        console.log("Fetching latest news...");
        const fetcher = new NewsFetcher();
        const feeds = await fetcher.fetchAll();
        console.log(`Fetched ${feeds.length} feeds.`);

        console.log("Summarizing news...");
        const summarizer = new NewsSummarizer();
        const summary = await summarizer.summarize(feeds);

        const categoryCount = Object.keys(summary).length;
        const itemCount = Object.values(summary).reduce(
            (sum, items) => sum + items.length,
            0,
        );
        console.log(
            `Summarized ${itemCount} articles across ${categoryCount} categories.`,
        );

        console.log("Formatting messages...");
        const formatter = new MessageFormatter();
        const messages = formatter.formatNewsSummary(summary);
        console.log(`Split into ${messages.length} message chunk(s).`);

        console.log("Broadcasting to subscribers...");
        const broadcaster = new MessageBroadcaster();
        const recipients = await broadcaster.broadcast(messages);

        console.log(`Broadcast sent to ${recipients.length} subscribers.`);
        break;
    }

    default: {
        console.error(`Unknown command: ${command}`);
        printUsage();
        process.exit(1);
    }
}
