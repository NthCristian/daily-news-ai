import { Bot } from "grammy";
import { SubscriptionManager } from "./subscription-manager";
import { TelegramConfig } from "./config";

export class TelegramBot {
    private bot: Bot;
    private subscriptions: SubscriptionManager;
    private running = false;

    constructor(subscriptions?: SubscriptionManager, token?: string) {
        const resolved = token ?? TelegramConfig.botToken;
        if (!resolved) {
            throw new Error(
                "Cannot create TelegramBot: TELEGRAM_BOT_TOKEN is not set in environment variables.",
            );
        }

        this.bot = new Bot(resolved);
        this.subscriptions = subscriptions ?? new SubscriptionManager();
        this.registerCommands();
    }

    /** Registers /start, /subscribe, and /unsubscribe command handlers */
    private registerCommands(): void {
        this.bot.command("start", async (ctx) => {
            await ctx.reply(
                "🤖 <b>AINews Bot</b>\n" +
                    "\n" +
                    "Eu envio um resumo diário das principais notícias de tecnologia, política e mundo, " +
                    "diretamente de fontes como G1, BBC, Hacker News, Wired e outras.\n" +
                    "\n" +
                    "<b>Comandos disponíveis:</b>\n" +
                    "/subscribe — Inscrever-se para receber o resumo diário\n" +
                    "/unsubscribe — Cancelar a inscrição\n" +
                    "\n" +
                    "O resumo é gerado por IA e enviado automaticamente uma vez por dia.",
                { parse_mode: "HTML" },
            );
        });

        this.bot.command("subscribe", async (ctx) => {
            const userId = ctx.from?.id;
            if (!userId) {
                await ctx.reply("Não foi possível identificar seu usuário.");
                return;
            }

            const added = this.subscriptions.subscribeUser(userId);
            await ctx.reply(
                added
                    ? "✅ Você se inscreveu para receber o resumo diário de notícias!"
                    : "ℹ️ Você já está inscrito.",
            );
        });

        this.bot.command("unsubscribe", async (ctx) => {
            const userId = ctx.from?.id;
            if (!userId) {
                await ctx.reply("Não foi possível identificar seu usuário.");
                return;
            }

            const removed = this.subscriptions.unsubscribeUser(userId);
            await ctx.reply(
                removed
                    ? "👋 Você foi removido da lista de inscritos. Até mais!"
                    : "ℹ️ Você não estava inscrito.",
            );
        });
    }

    /** Starts the bot and begins polling for messages */
    start(): void {
        if (this.running) {
            console.warn("Bot is already running.");
            return;
        }
        this.running = true;
        console.info(
            "Telegram bot starting... Commands: /start, /subscribe, /unsubscribe",
        );
        this.bot.start().catch(console.error);
    }

    /** Stops the bot and stops polling */
    async stop(): Promise<void> {
        if (!this.running) {
            console.warn("Bot is not running.");
            return;
        }
        await this.bot.stop();
        this.running = false;
        console.info("Telegram bot stopped.");
    }
}
